import { StockfishWorkerManager } from '@/shared/lib/chess/engine/workerManager';
import { StockfishMessageHandler } from '@/shared/lib/chess/engine/messageHandler';
import type { EngineConfig } from '@/shared/lib/chess/engine/types';

// Mock the message handler
jest.mock('@/shared/lib/chess/engine/messageHandler');

// Mock global Worker
const mockWorker = {
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onmessage: null as any,
  onerror: null as any
};

global.Worker = jest.fn(() => mockWorker) as any;

describe('StockfishWorkerManager', () => {
  let manager: StockfishWorkerManager;
  let mockMessageHandler: jest.Mocked<StockfishMessageHandler>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset worker mock
    mockWorker.postMessage.mockClear();
    mockWorker.terminate.mockClear();
    mockWorker.addEventListener.mockClear();
    mockWorker.removeEventListener.mockClear();
    mockWorker.onmessage = null;
    mockWorker.onerror = null;
    
    // Setup message handler mock
    mockMessageHandler = {
      handleMessage: jest.fn(),
      setCurrentRequest: jest.fn(),
      clearCurrentRequest: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        messagesProcessed: 0,
        hasCurrentRequest: false
      })
    } as any;
    
    (StockfishMessageHandler as jest.MockedClass<typeof StockfishMessageHandler>)
      .mockImplementation(() => mockMessageHandler);
  });

  afterEach(() => {
    if (manager) {
      try {
        manager.cleanup();
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe('Initialization', () => {
    test('should create manager with default config', () => {
      manager = new StockfishWorkerManager();
      
      expect(manager).toBeDefined();
      expect(StockfishMessageHandler).toHaveBeenCalled();
    });

    test('should create manager with custom config', () => {
      const config: EngineConfig = {
        maxDepth: 20,
        maxTime: 3000,
        maxNodes: 200000,
        useThreads: 2,
        hashSize: 32,
        skillLevel: 18
      };
      
      manager = new StockfishWorkerManager(config);
      
      expect(manager.getConfig()).toMatchObject(config);
    });

    test('should create message handler', () => {
      manager = new StockfishWorkerManager();
      
      expect(StockfishMessageHandler).toHaveBeenCalled();
    });
  });

  describe('Worker Initialization', () => {
    test('should initialize worker successfully', async () => {
      manager = new StockfishWorkerManager();
      
      // Mock handleMessage to return proper response for ready state
      mockMessageHandler.handleMessage.mockImplementation((message) => {
        if (message === 'uciok') {
          return { type: 'ready' };
        }
        return null;
      });
      
      // Start initialization
      const initPromise = manager.initialize();
      
      // Wait for worker setup and initial command
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Simulate worker sending 'uciok' response
      mockWorker.onmessage?.({ data: 'uciok' });
      
      const result = await initPromise;
      
      expect(result).toBe(true);
      expect(global.Worker).toHaveBeenCalledWith('/stockfish.js');
    }, 10000);

    test('should handle worker creation failure', async () => {
      (global.Worker as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Worker creation failed');
      });
      
      manager = new StockfishWorkerManager();
      const result = await manager.initialize();
      
      expect(result).toBe(false);
    });

    test('should handle initialization timeout', async () => {
      manager = new StockfishWorkerManager();
      
      // Don't trigger ready callback, just wait for timeout
      const result = await manager.initialize();
      
      expect(result).toBe(false);
    }, 10000);

    test('should handle multiple initialization attempts', async () => {
      manager = new StockfishWorkerManager();
      
      const promise1 = manager.initialize();
      const promise2 = manager.initialize();
      
      // Both should return promises
      expect(promise1).toBeInstanceOf(Promise);
      expect(promise2).toBeInstanceOf(Promise);
      
      // Resolve both
      mockMessageHandler.handleMessage.mockReturnValue({ type: 'ready' });
      mockWorker.onmessage?.({ data: 'uciok' });
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    }, 10000);

    test('should handle worker error during initialization', async () => {
      manager = new StockfishWorkerManager();
      
      const initPromise = manager.initialize();
      
      // Simulate worker error immediately
      setTimeout(() => {
        mockWorker.onerror?.({ message: 'Worker error' });
      }, 10);
      
      const result = await initPromise;
      
      expect(result).toBe(false);
    }, 15000);

    test('should handle max initialization attempts', async () => {
      manager = new StockfishWorkerManager();
      
      // First 3 attempts fail (max attempts)
      let attempts = 0;
      (global.Worker as jest.Mock).mockImplementation(() => {
        attempts++;
        if (attempts <= 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return mockWorker;
      });
      
      // First 3 attempts should fail
      for (let i = 0; i < 3; i++) {
        const result = await manager.initialize();
        expect(result).toBe(false);
      }
      
      // Fourth attempt should also fail due to max attempts reached
      const finalResult = await manager.initialize();
      expect(finalResult).toBe(false);
      expect(attempts).toBe(3); // Should not try 4th time
    }, 10000);
  });

  describe('Worker Communication', () => {
    test('should send commands to worker', async () => {
      manager = new StockfishWorkerManager();
      
      // Initialize first
      const initPromise = manager.initialize();
      mockMessageHandler.handleMessage.mockReturnValue({ type: 'ready' });
      mockWorker.onmessage?.({ data: 'uciok' });
      await initPromise;
      
      manager.sendCommand('position fen ...');
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith('position fen ...');
    }, 10000);

    test('should not send commands if worker not ready', () => {
      manager = new StockfishWorkerManager();
      
      manager.sendCommand('position fen ...');
      
      expect(mockWorker.postMessage).not.toHaveBeenCalled();
    });

    test('should handle message events', async () => {
      manager = new StockfishWorkerManager();
      
      const initPromise = manager.initialize();
      
      // Simulate message
      const messageData = 'info depth 10 score cp 42';
      mockWorker.onmessage?.({ data: messageData });
      
      expect(mockMessageHandler.handleMessage).toHaveBeenCalledWith(messageData);
    }, 10000);

    test('should handle SSR environment', async () => {
      // Simulate SSR by removing window
      const originalWindow = global.window;
      delete (global as any).window;
      
      manager = new StockfishWorkerManager();
      const result = await manager.initialize();
      
      expect(result).toBe(false);
      expect(global.Worker).not.toHaveBeenCalled();
      
      // Restore window
      (global as any).window = originalWindow;
    });
  });

  describe('Worker State', () => {
    test('should report worker ready state', async () => {
      manager = new StockfishWorkerManager();
      
      expect(manager.isWorkerReady()).toBe(false);
      
      // Initialize the worker
      const initPromise = manager.initialize();
      mockMessageHandler.handleMessage.mockReturnValue({ type: 'ready' });
      mockWorker.onmessage?.({ data: 'uciok' });
      await initPromise;
      
      expect(manager.isWorkerReady()).toBe(true);
    }, 10000);

    test('should get message handler', () => {
      manager = new StockfishWorkerManager();
      
      const handler = manager.getMessageHandler();
      
      expect(handler).toBe(mockMessageHandler);
    });
  });

  describe('Cleanup and Restart', () => {
    test('should cleanup worker', async () => {
      manager = new StockfishWorkerManager();
      
      // Initialize first
      const initPromise = manager.initialize();
      mockMessageHandler.handleMessage.mockReturnValue({ type: 'ready' });
      mockWorker.onmessage?.({ data: 'uciok' });
      await initPromise;
      
      manager.cleanup();
      
      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(manager.isWorkerReady()).toBe(false);
    }, 10000);

    test('should handle cleanup errors gracefully', async () => {
      manager = new StockfishWorkerManager();
      
      // Initialize first
      const initPromise = manager.initialize();
      mockMessageHandler.handleMessage.mockReturnValue({ type: 'ready' });
      mockWorker.onmessage?.({ data: 'uciok' });
      await initPromise;
      
      // Make terminate throw
      mockWorker.terminate.mockImplementation(() => {
        throw new Error('Terminate failed');
      });
      
      // Should not throw
      expect(() => manager.cleanup()).not.toThrow();
    }, 10000);

    test('should restart worker', async () => {
      manager = new StockfishWorkerManager();
      
      // Initialize first
      const initPromise = manager.initialize();
      mockMessageHandler.handleMessage.mockReturnValue({ type: 'ready' });
      mockWorker.onmessage?.({ data: 'uciok' });
      await initPromise;
      
      // Clear mocks
      jest.clearAllMocks();
      
      // Restart
      const restartPromise = manager.restart();
      mockMessageHandler.handleMessage.mockReturnValue({ type: 'ready' });
      mockWorker.onmessage?.({ data: 'uciok' });
      
      const result = await restartPromise;
      
      expect(result).toBe(true);
      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(global.Worker).toHaveBeenCalled();
    }, 15000);
  });

  describe('Configuration', () => {
    test('should update configuration', () => {
      manager = new StockfishWorkerManager();
      
      const newConfig = { maxDepth: 25, hashSize: 64 };
      manager.updateConfig(newConfig);
      
      const config = manager.getConfig();
      expect(config.maxDepth).toBe(25);
      expect(config.hashSize).toBe(64);
    });

    test('should merge configuration updates', () => {
      const initialConfig: EngineConfig = {
        maxDepth: 10,
        maxTime: 2000,
        maxNodes: 100000,
        useThreads: 1,
        hashSize: 16
      };
      manager = new StockfishWorkerManager(initialConfig);
      
      manager.updateConfig({ maxTime: 5000 });
      
      const config = manager.getConfig();
      expect(config.maxDepth).toBe(10);
      expect(config.maxTime).toBe(5000);
    });

    test('should get current configuration', () => {
      const initialConfig: EngineConfig = {
        maxDepth: 12,
        maxTime: 1500,
        maxNodes: 50000,
        useThreads: 1,
        hashSize: 8,
        skillLevel: 15
      };
      
      manager = new StockfishWorkerManager(initialConfig);
      
      const config = manager.getConfig();
      expect(config).toMatchObject(initialConfig);
    });
  });

  describe('Statistics', () => {
    test('should return worker statistics', () => {
      manager = new StockfishWorkerManager();
      
      const stats = manager.getStats();
      
      expect(stats).toEqual({
        isReady: false,
        attempts: 0,
        hasWorker: false,
        messageStats: {
          messagesProcessed: 0,
          hasCurrentRequest: false
        }
      });
    });

    test('should update stats after initialization', async () => {
      manager = new StockfishWorkerManager();
      
      const initPromise = manager.initialize();
      mockMessageHandler.handleMessage.mockReturnValue({ type: 'ready' });
      mockWorker.onmessage?.({ data: 'uciok' });
      await initPromise;
      
      const stats = manager.getStats();
      
      expect(stats.isReady).toBe(true);
      expect(stats.hasWorker).toBe(true);
    }, 10000);

    test('should track retry count', async () => {
      manager = new StockfishWorkerManager();
      
      // First attempt fails
      (global.Worker as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Failed');
      });
      
      await manager.initialize();
      
      const stats = manager.getStats();
      expect(stats.attempts).toBe(1);
      
      // Try again
      (global.Worker as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Failed again');
      });
      
      await manager.initialize();
      
      const stats2 = manager.getStats();
      expect(stats2.attempts).toBe(2);
    }, 10000);
  });

  describe('Edge Cases', () => {
    test('should handle no Worker environment', async () => {
      const originalWorker = global.Worker;
      delete (global as any).Worker;
      
      manager = new StockfishWorkerManager();
      const result = await manager.initialize();
      
      expect(result).toBe(false);
      
      (global as any).Worker = originalWorker;
    });

    test('should handle worker sending unexpected messages', async () => {
      manager = new StockfishWorkerManager();
      
      const initPromise = manager.initialize();
      
      // Send various message types
      mockWorker.onmessage?.({ data: null });
      mockWorker.onmessage?.({ data: undefined });
      mockWorker.onmessage?.({ data: 123 });
      mockWorker.onmessage?.({ data: { invalid: true } });
      
      // Eventually send valid message
      mockMessageHandler.handleMessage.mockReturnValue({ type: 'ready' });
      mockWorker.onmessage?.({ data: 'uciok' });
      
      const result = await initPromise;
      expect(result).toBe(true);
    }, 10000);

    test('should handle concurrent restart calls', async () => {
      manager = new StockfishWorkerManager();
      
      // Initialize first
      const initPromise = manager.initialize();
      mockMessageHandler.handleMessage.mockReturnValue({ type: 'ready' });
      mockWorker.onmessage?.({ data: 'uciok' });
      await initPromise;
      
      // Call restart multiple times
      const restart1 = manager.restart();
      const restart2 = manager.restart();
      
      // Both should be promises
      expect(restart1).toBeInstanceOf(Promise);
      expect(restart2).toBeInstanceOf(Promise);
      
      // Resolve them
      mockMessageHandler.handleMessage.mockReturnValue({ type: 'ready' });
      mockWorker.onmessage?.({ data: 'uciok' });
      
      const [result1, result2] = await Promise.all([restart1, restart2]);
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    }, 15000);
  });
});