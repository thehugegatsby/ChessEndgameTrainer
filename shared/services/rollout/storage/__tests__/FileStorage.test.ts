/**
 * Tests for File Storage implementation
 */

import { promises as fs } from 'fs';
import path from 'path';
import { FileStorage } from '../FileStorage';
import { RolloutState } from '../../types';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn()
  }
}));

describe('FileStorage', () => {
  let storage: FileStorage;
  const mockState: RolloutState = {
    currentStage: 'canary',
    currentPercentage: 10,
    stageStartTime: Date.now(),
    lastHealthCheck: Date.now(),
    lastProgression: Date.now(),
    isHealthy: true,
    isPaused: false,
    history: []
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure we're in Node.js environment for tests
    delete (global as any).window;
    storage = new FileStorage('/tmp/test-rollout.json');
  });
  
  describe('read', () => {
    it('should read and parse JSON from file', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockState));
      
      const result = await storage.read();
      
      expect(result).toEqual(mockState);
      expect(fs.readFile).toHaveBeenCalledWith('/tmp/test-rollout.json', 'utf8');
    });
    
    it('should return null if file does not exist', async () => {
      const error = new Error('ENOENT');
      (error as any).code = 'ENOENT';
      (fs.readFile as jest.Mock).mockRejectedValue(error);
      
      const result = await storage.read();
      
      expect(result).toBeNull();
    });
    
    it('should throw error for other read failures', async () => {
      const error = new Error('Permission denied');
      (error as any).code = 'EACCES';
      (fs.readFile as jest.Mock).mockRejectedValue(error);
      
      await expect(storage.read()).rejects.toThrow('Permission denied');
    });
  });
  
  describe('write', () => {
    it('should write state atomically', async () => {
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.rename as jest.Mock).mockResolvedValue(undefined);
      
      await storage.write(mockState);
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/tmp/test-rollout.json.lock',
        expect.any(String),
        { flag: 'wx' }
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/tmp/test-rollout.json.tmp',
        JSON.stringify(mockState, null, 2),
        'utf8'
      );
      expect(fs.rename).toHaveBeenCalledWith(
        '/tmp/test-rollout.json.tmp',
        '/tmp/test-rollout.json'
      );
      expect(fs.unlink).toHaveBeenCalledWith('/tmp/test-rollout.json.lock');
    });
    
    it('should handle read-only filesystem gracefully', async () => {
      const error = new Error('Read-only file system');
      (error as any).code = 'EROFS';
      (fs.writeFile as jest.Mock).mockRejectedValue(error);
      
      // Should not throw
      await expect(storage.write(mockState)).resolves.not.toThrow();
    });
    
    it('should clean up temp file on error', async () => {
      (fs.writeFile as jest.Mock)
        .mockResolvedValueOnce(undefined) // Lock file
        .mockResolvedValueOnce(undefined); // Temp file
      (fs.rename as jest.Mock).mockRejectedValue(new Error('Rename failed'));
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);
      
      await expect(storage.write(mockState)).rejects.toThrow('Rename failed');
      
      // Should try to clean up temp file
      expect(fs.unlink).toHaveBeenCalledWith('/tmp/test-rollout.json.tmp');
    });
  });
  
  describe('update', () => {
    it('should update state atomically', async () => {
      const currentState: RolloutState = { ...mockState, currentPercentage: 5 };
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(currentState));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.rename as jest.Mock).mockResolvedValue(undefined);
      
      const result = await storage.update(state => {
        if (state) {
          return { ...state, currentPercentage: 20 };
        }
        return null;
      });
      
      expect(result).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/tmp/test-rollout.json.tmp',
        expect.stringContaining('"currentPercentage": 20'),
        'utf8'
      );
    });
    
    it('should return false if update function returns null', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockState));
      
      const result = await storage.update(() => null);
      
      expect(result).toBe(false);
      expect(fs.writeFile).not.toHaveBeenCalledWith(
        '/tmp/test-rollout.json.tmp',
        expect.anything(),
        'utf8'
      );
    });
  });
  
  describe('clear', () => {
    it('should delete the file', async () => {
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);
      
      await storage.clear();
      
      expect(fs.unlink).toHaveBeenCalledWith('/tmp/test-rollout.json');
    });
    
    it('should not throw if file does not exist', async () => {
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      const error = new Error('ENOENT');
      (error as any).code = 'ENOENT';
      (fs.unlink as jest.Mock).mockRejectedValue(error);
      
      await expect(storage.clear()).resolves.not.toThrow();
    });
  });
  
  describe('file locking', () => {
    it('should retry lock acquisition on conflict', async () => {
      const lockError = new Error('File exists');
      (lockError as any).code = 'EEXIST';
      
      // Fail twice, then succeed
      (fs.writeFile as jest.Mock)
        .mockRejectedValueOnce(lockError)
        .mockRejectedValueOnce(lockError)
        .mockResolvedValue(undefined);
      
      // Mock stale lock check
      (fs.stat as jest.Mock).mockResolvedValue({
        mtimeMs: Date.now() - 10000 // 10 seconds old
      });
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);
      
      await storage.write(mockState);
      
      // Should have tried to acquire lock 3 times
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/tmp/test-rollout.json.lock',
        expect.any(String),
        { flag: 'wx' }
      );
      expect(fs.writeFile).toHaveBeenCalledTimes(5); // 3 lock attempts + temp file + lock file on success
    });
    
    it('should fail after max retries', async () => {
      const lockError = new Error('File exists');
      (lockError as any).code = 'EEXIST';
      
      // Always fail
      (fs.writeFile as jest.Mock).mockRejectedValue(lockError);
      (fs.stat as jest.Mock).mockResolvedValue({
        mtimeMs: Date.now() // Fresh lock
      });
      
      await expect(storage.write(mockState)).rejects.toThrow('Failed to acquire file lock');
    });
  });
});