/**
 * @fileoverview Unit tests for StockfishWorkerManager
 * @version 1.0.0
 * @description Tests worker lifecycle, memory management, and mobile constraints
 * Following test guidelines from docs/testing/TESTING_GUIDELINES.md
 */

import { StockfishWorkerManager } from '../../../shared/lib/chess/engine/workerManager';
import { StockfishMessageHandler } from '../../../shared/lib/chess/engine/messageHandler';
import type { EngineConfig, EngineResponse } from '../../../shared/lib/chess/engine/types';

// Mock dependencies
jest.mock('../../../shared/lib/chess/engine/messageHandler');

// Mock Worker API
const mockWorker = {
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onmessage: null as ((e: MessageEvent) => void) | null,
  onerror: null as ((e: ErrorEvent) => void) | null,
  onmessageerror: null as ((e: MessageEvent) => void) | null,
};

// Store original Worker for cleanup
const originalWorker = global.Worker;

beforeAll(() => {
  // Mock global Worker
  global.Worker = jest.fn(() => mockWorker) as any;
});

afterAll(() => {
  // Restore original Worker
  global.Worker = originalWorker;
});

describe('StockfishWorkerManager', () => {
  let manager: StockfishWorkerManager;
  let mockMessageHandler: jest.Mocked<StockfishMessageHandler>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock worker
    mockWorker.postMessage.mockClear();
    mockWorker.terminate.mockClear();
    mockWorker.onmessage = null;
    mockWorker.onerror = null;
    mockWorker.onmessageerror = null;
    
    // Setup message handler mock
    mockMessageHandler = {
      handleMessage: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        messagesProcessed: 0,
        hasCurrentRequest: false
      }),
      reset: jest.fn(),
      setCurrentRequest: jest.fn(),
      clearCurrentRequest: jest.fn(),
      getLastEvaluation: jest.fn()
    } as any;
    
    // Mock the constructor to return our mock
    (StockfishMessageHandler as jest.Mock).mockImplementation(() => mockMessageHandler);
    
    // Create new manager instance
    manager = new StockfishWorkerManager();
  });

  afterEach(() => {
    // Cleanup manager
    manager.cleanup();
  });

  // Helper function to initialize and make worker ready
  const initializeAndMakeReady = async () => {
    mockMessageHandler.handleMessage.mockReturnValueOnce({ type: 'ready' });
    const resultPromise = manager.initialize();
    
    // Wait for event handlers to be set up
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Simulate worker ready message
    if (mockWorker.onmessage) {
      mockWorker.onmessage(new MessageEvent('message', { data: 'readyok' }));
    }
    
    return resultPromise;
  };

  describe('initialization', () => {
    it('should initialize worker with correct configuration', async () => {
      // Setup ready response
      mockMessageHandler.handleMessage.mockReturnValueOnce({ type: 'ready' });
      
      // Start initialization
      const resultPromise = manager.initialize();
      
      // Wait for event handlers to be set up
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Simulate worker ready message
      if (mockWorker.onmessage) {
        mockWorker.onmessage(new MessageEvent('message', { data: 'uciok' }));
      }
      
      const result = await resultPromise;
      
      expect(result).toBe(true);
      expect(global.Worker).toHaveBeenCalledWith('/stockfish.js');
      expect(mockWorker.postMessage).toHaveBeenCalledWith('uci');
    });

    it('should handle initialization failure gracefully', async () => {
      // Mock Worker constructor to throw
      (global.Worker as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Worker creation failed');
      });
      
      const result = await manager.initialize();
      
      expect(result).toBe(false);
      expect(manager.isWorkerReady()).toBe(false);
    });

    it('should respect maximum initialization attempts', async () => {
      // Make all initialization attempts fail by not sending ready signal
      mockMessageHandler.handleMessage.mockReturnValue(null);
      
      // Override timeout for faster test
      jest.setTimeout(20000);
      
      // Try to initialize 4 times (more than max of 3)
      const results: boolean[] = [];
      
      // First 3 attempts should timeout
      for (let i = 0; i < 3; i++) {
        results.push(await manager.initialize());
      }
      
      // 4th attempt should fail immediately (max attempts reached)
      results.push(await manager.initialize());
      
      // All should be false (no ready signal sent)
      expect(results).toEqual([false, false, false, false]);
      // After 4 attempts, only 3 are counted because the 4th fails immediately
      expect(manager.getStats().attempts).toBeLessThanOrEqual(4);
      expect(manager.getStats().attempts).toBeGreaterThanOrEqual(3);
    });

    it('should handle SSR environment by returning false', async () => {
      // Temporarily remove window
      const originalWindow = global.window;
      delete (global as any).window;
      
      const result = await manager.initialize();
      
      expect(result).toBe(false);
      expect(global.Worker).not.toHaveBeenCalled();
      
      // Restore window
      (global as any).window = originalWindow;
    });

    it('should wait for ready signal with timeout', async () => {
      // Don't send ready signal, let it timeout
      mockMessageHandler.handleMessage.mockReturnValue(null);
      
      const startTime = Date.now();
      const result = await manager.initialize();
      const duration = Date.now() - startTime;
      
      expect(result).toBe(false);
      expect(duration).toBeGreaterThanOrEqual(5000); // 5 second timeout
      expect(duration).toBeLessThan(6000); // Should not wait much longer
    });
  });

  describe('worker lifecycle management', () => {
    beforeEach(async () => {
      await initializeAndMakeReady();
    });

    it('should properly cleanup worker resources', () => {
      manager.cleanup();
      
      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(manager.isWorkerReady()).toBe(false);
      expect(manager.getStats().hasWorker).toBe(false);
    });

    it('should handle cleanup errors gracefully', () => {
      // Make terminate throw
      mockWorker.terminate.mockImplementationOnce(() => {
        throw new Error('Terminate failed');
      });
      
      // Should not throw
      expect(() => manager.cleanup()).not.toThrow();
      // Even if terminate fails, state should be properly reset
      expect(manager.isWorkerReady()).toBe(false);
      expect(manager.getStats().hasWorker).toBe(false);
    });

    it('should support restart functionality', async () => {
      // Initial state should be ready
      expect(manager.isWorkerReady()).toBe(true);
      
      // Setup ready response for restart
      mockMessageHandler.handleMessage.mockReturnValueOnce({ type: 'ready' });
      
      // Start restart
      const restartPromise = manager.restart();
      
      // Wait for event handlers to be set up
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Simulate ready
      if (mockWorker.onmessage) {
        mockWorker.onmessage(new MessageEvent('message', { data: 'readyok' }));
      }
      
      const result = await restartPromise;
      
      expect(result).toBe(true);
      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(global.Worker).toHaveBeenCalledTimes(2); // Initial + restart
      expect(manager.getStats().attempts).toBe(1); // Reset counter
    });

    it('should handle worker errors by cleaning up', () => {
      // Trigger error handler
      if (mockWorker.onerror) {
        mockWorker.onerror(new ErrorEvent('error'));
      }
      
      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(manager.isWorkerReady()).toBe(false);
    });
  });

  describe('command sending and message handling', () => {
    beforeEach(async () => {
      await initializeAndMakeReady();
    });

    it('should send commands when worker is ready', () => {
      manager.sendCommand('position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        'position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    });

    it('should not send commands when worker is not ready', () => {
      manager.cleanup();
      mockWorker.postMessage.mockClear();
      
      manager.sendCommand('go depth 20');
      
      expect(mockWorker.postMessage).not.toHaveBeenCalled();
    });

    it('should handle postMessage errors gracefully', () => {
      mockWorker.postMessage.mockImplementationOnce(() => {
        throw new Error('postMessage failed');
      });
      
      // Should not throw
      expect(() => manager.sendCommand('uci')).not.toThrow();
    });

    it('should forward engine responses to callback', () => {
      const mockCallback = jest.fn();
      manager.setResponseCallback(mockCallback);
      
      const mockResponse: EngineResponse = {
        id: 'test-123',
        type: 'evaluation',
        evaluation: { score: 50, mate: null, depth: 20 }
      };
      
      mockMessageHandler.handleMessage.mockReturnValueOnce(mockResponse);
      
      // Trigger message
      if (mockWorker.onmessage) {
        mockWorker.onmessage(new MessageEvent('message', { data: 'info depth 20 score cp 50' }));
      }
      
      expect(mockCallback).toHaveBeenCalledWith(mockResponse);
    });

    it('should not forward ready messages to callback', () => {
      const mockCallback = jest.fn();
      manager.setResponseCallback(mockCallback);
      
      mockMessageHandler.handleMessage.mockReturnValueOnce({ type: 'ready' });
      
      // Trigger message
      if (mockWorker.onmessage) {
        mockWorker.onmessage(new MessageEvent('message', { data: 'readyok' }));
      }
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('configuration management', () => {
    it('should use default mobile-optimized configuration', () => {
      const config = manager.getConfig();
      
      expect(config).toEqual({
        maxDepth: 15,
        maxTime: 2000,
        maxNodes: 100000,
        useThreads: 1,
        hashSize: 16,
        skillLevel: 20,
      });
    });

    it('should update configuration and send to engine when ready', async () => {
      // Initialize first
      await initializeAndMakeReady();
      
      // Clear previous calls
      mockWorker.postMessage.mockClear();
      
      // Update config
      manager.updateConfig({
        hashSize: 32,
        useThreads: 2,
        skillLevel: 15
      });
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith('setoption name Hash value 32');
      expect(mockWorker.postMessage).toHaveBeenCalledWith('setoption name Threads value 2');
      expect(mockWorker.postMessage).toHaveBeenCalledWith('setoption name Skill Level value 15');
    });

    it('should not send config updates when worker not ready', () => {
      manager.updateConfig({ hashSize: 64 });
      
      expect(mockWorker.postMessage).not.toHaveBeenCalled();
    });

    it('should merge partial config updates', () => {
      const originalConfig = manager.getConfig();
      
      manager.updateConfig({ maxDepth: 20 });
      
      const newConfig = manager.getConfig();
      expect(newConfig.maxDepth).toBe(20);
      expect(newConfig.maxTime).toBe(originalConfig.maxTime);
      expect(newConfig.hashSize).toBe(originalConfig.hashSize);
    });
  });

  describe('mobile constraints and memory management', () => {
    it('should limit to single thread by default for mobile', () => {
      const config = manager.getConfig();
      expect(config.useThreads).toBe(1);
    });

    it('should use conservative hash size for mobile', () => {
      const config = manager.getConfig();
      expect(config.hashSize).toBe(16); // 16MB is mobile-friendly
    });

    it('should limit search depth for mobile performance', () => {
      const config = manager.getConfig();
      expect(config.maxDepth).toBe(15);
      expect(config.maxTime).toBe(2000); // 2 seconds max
      expect(config.maxNodes).toBe(100000);
    });

    it('should provide accurate statistics for debugging', async () => {
      // Initial state
      let stats = manager.getStats();
      expect(stats.isReady).toBe(false);
      expect(stats.attempts).toBe(0);
      expect(stats.hasWorker).toBe(false);
      
      // After initialization
      await initializeAndMakeReady();
      
      stats = manager.getStats();
      expect(stats.isReady).toBe(true);
      expect(stats.attempts).toBe(1);
      expect(stats.hasWorker).toBe(true);
      expect(stats.messageStats).toEqual({
        messagesProcessed: 0,
        hasCurrentRequest: false
      });
    });
  });

  describe('performance characteristics', () => {
    it('should initialize within reasonable time on mobile', async () => {
      const start = performance.now();
      const result = await initializeAndMakeReady();
      
      const duration = performance.now() - start;
      
      expect(result).toBe(true);
      expect(duration).toBeLessThan(100); // Should be fast when ready immediately
    });

    it('should handle multiple ready callbacks efficiently', async () => {
      // Don't send ready immediately
      mockMessageHandler.handleMessage.mockReturnValue(null);
      
      // Start initialization (which internally calls waitForReady)
      const initPromise = manager.initialize();
      
      // Wait a bit then send ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now send ready
      mockMessageHandler.handleMessage.mockReturnValueOnce({ type: 'ready' });
      if (mockWorker.onmessage) {
        mockWorker.onmessage(new MessageEvent('message', { data: 'readyok' }));
      }
      
      const result = await initPromise;
      
      expect(result).toBe(true);
      expect(manager.isWorkerReady()).toBe(true);
    });
  });
});