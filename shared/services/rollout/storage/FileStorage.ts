/**
 * File-based storage implementation for rollout state
 * Uses atomic writes and file locking for concurrent access
 */

import type { promises as fsType } from 'fs';
import type pathType from 'path';
import { StoragePort } from './StoragePort';
import { RolloutState } from '../types';

// Dynamic imports for Node.js modules
let fs: typeof fsType;
let path: typeof pathType;

// Initialize Node.js modules
const initializeNodeModules = () => {
  if (typeof window === 'undefined' && !fs) {
    fs = require('fs').promises;
    path = require('path');
  }
};

export class FileStorage implements StoragePort {
  private filePath: string;
  private lockFilePath: string;
  private lockTimeout = 5000; // 5 seconds
  private maxRetries = 20;
  private retryDelay = 50; // 50ms
  
  constructor(filePath?: string) {
    if (typeof window !== 'undefined') {
      throw new Error('FileStorage is not supported in browser environment');
    }
    initializeNodeModules();
    this.filePath = filePath || path.join(process.cwd(), '.rollout-state.json');
    this.lockFilePath = `${this.filePath}.lock`;
  }
  
  async read(): Promise<RolloutState | null> {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet
        return null;
      }
      console.error('Error reading rollout state:', error);
      throw error;
    }
  }
  
  async write(state: RolloutState): Promise<void> {
    await this.withLock(async () => {
      await this.atomicWrite(state);
    });
  }
  
  async update(updateFn: (current: RolloutState | null) => RolloutState | null): Promise<boolean> {
    return this.withLock(async () => {
      const current = await this.read();
      const newState = updateFn(current);
      
      if (newState === null || newState === current) {
        return false; // No update needed
      }
      
      await this.atomicWrite(newState);
      return true;
    });
  }
  
  async clear(): Promise<void> {
    await this.withLock(async () => {
      try {
        await fs.unlink(this.filePath);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    });
  }
  
  private async atomicWrite(state: RolloutState): Promise<void> {
    const tempPath = `${this.filePath}.tmp`;
    
    try {
      // Write to temporary file
      const data = JSON.stringify(state, null, 2);
      await fs.writeFile(tempPath, data, 'utf8');
      
      // Atomic rename
      await fs.rename(tempPath, this.filePath);
    } catch (error: any) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch {}
      
      // Handle read-only filesystem gracefully
      if (error.code === 'EROFS' || error.code === 'EACCES' || error.code === 'EPERM') {
        console.warn('Filesystem is read-only or inaccessible. Rollout state changes will not persist.');
        return; // Graceful degradation
      }
      
      throw error;
    }
  }
  
  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const lockAcquired = await this.acquireLock();
    
    if (!lockAcquired) {
      throw new Error('Failed to acquire file lock for rollout state');
    }
    
    try {
      return await fn();
    } finally {
      await this.releaseLock();
    }
  }
  
  private async acquireLock(): Promise<boolean> {
    const startTime = Date.now();
    
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        // Try to create lock file exclusively
        await fs.writeFile(this.lockFilePath, process.pid.toString(), { flag: 'wx' });
        return true;
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // Lock file exists, check if it's stale
          if (await this.isLockStale()) {
            await this.forceReleaseLock();
            continue;
          }
          
          // Wait and retry
          if (Date.now() - startTime < this.lockTimeout) {
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            continue;
          }
        }
        
        // Handle read-only filesystem
        if (error.code === 'EROFS' || error.code === 'EACCES' || error.code === 'EPERM') {
          console.warn('Cannot create lock file on read-only filesystem');
          return true; // Proceed without lock in read-only mode
        }
        
        throw error;
      }
    }
    
    return false;
  }
  
  private async releaseLock(): Promise<void> {
    try {
      await fs.unlink(this.lockFilePath);
    } catch (error: any) {
      // Ignore if lock file doesn't exist or filesystem is read-only
      if (error.code !== 'ENOENT' && error.code !== 'EROFS' && error.code !== 'EACCES') {
        console.error('Error releasing lock:', error);
      }
    }
  }
  
  private async forceReleaseLock(): Promise<void> {
    try {
      await fs.unlink(this.lockFilePath);
    } catch {}
  }
  
  private async isLockStale(): Promise<boolean> {
    try {
      const stats = await fs.stat(this.lockFilePath);
      const age = Date.now() - stats.mtimeMs;
      return age > this.lockTimeout;
    } catch {
      return true; // If we can't stat the file, consider it stale
    }
  }
}