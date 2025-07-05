import { Engine } from '../index';
import { StockfishWorkerManager } from '../workerManager';
import type { BestMoveRequest, EvaluationRequest } from '../types';

// Mock the worker manager
jest.mock('../workerManager');

describe.skip('Engine', () => {
  let mockWorkerManager: jest.Mocked<StockfishWorkerManager>;
  
  beforeEach(() => {
    // Clear singleton instance
    (Engine as any).instance = null;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup worker manager mock
    mockWorkerManager = {
      initialize: jest.fn().mockResolvedValue(true),
      isWorkerReady: jest.fn().mockReturnValue(false),
      sendCommand: jest.fn(),
      setResponseCallback: jest.fn(),
      getMessageHandler: jest.fn().mockReturnValue({
        setCurrentRequest: jest.fn(),
        clearCurrentRequest: jest.fn()
      }),
      cleanup: jest.fn(),
      restart: jest.fn().mockResolvedValue(true),
      updateConfig: jest.fn(),
      getStats: jest.fn().mockReturnValue({ initialized: true }),
      getConfig: jest.fn().mockReturnValue({ maxRetries: 3 })
    } as any;
    
    (StockfishWorkerManager as jest.MockedClass<typeof StockfishWorkerManager>).mockImplementation(() => mockWorkerManager);
  });

  afterEach(async () => {
    // Clean up singleton
    const engine = (Engine as any).instance;
    if (engine) {
      try {
        // Cancel any pending requests first
        const requestManager = (engine as any).requestManager;
        if (requestManager) {
          // Clear queue without rejecting promises
          (engine as any).requestQueue = [];
          (engine as any).isProcessingQueue = false;
        }
        engine.quit();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    (Engine as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance on multiple calls', () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(true);
      
      const instance1 = Engine.getInstance();
      const instance2 = Engine.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    test('should create new instance if current one has no worker ready', () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(false);
      
      const instance1 = Engine.getInstance();
      const instance2 = Engine.getInstance();
      
      // Should force new instance
      expect(instance1).not.toBe(instance2);
    });

    test('should accept config on initialization', () => {
      const config = { maxRetries: 5, timeout: 10000 };
      const engine = Engine.getInstance(config);
      
      expect(StockfishWorkerManager).toHaveBeenCalledWith(config);
    });
  });

  describe('Initialization', () => {
    test('should initialize worker manager on creation', () => {
      Engine.getInstance();
      
      expect(mockWorkerManager.initialize).toHaveBeenCalled();
    });

    test('should handle initialization failure gracefully', async () => {
      mockWorkerManager.initialize.mockResolvedValue(false);
      
      const engine = Engine.getInstance();
      // Give time for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockWorkerManager.initialize).toHaveBeenCalled();
    });

    test('should handle initialization error', async () => {
      mockWorkerManager.initialize.mockRejectedValue(new Error('Init failed'));
      
      const engine = Engine.getInstance();
      // Give time for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockWorkerManager.initialize).toHaveBeenCalled();
    });
  });

  describe('getBestMove', () => {
    test('should return null if worker not ready and not in browser', async () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(false);
      const originalWindow = global.window;
      delete (global as any).window;
      
      const engine = Engine.getInstance();
      const result = await engine.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      expect(result).toBeNull();
      
      (global as any).window = originalWindow;
    });

    test('should lazy initialize if in browser and worker not ready', async () => {
      mockWorkerManager.isWorkerReady
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      
      const engine = Engine.getInstance();
      const movePromise = engine.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      // Simulate worker becoming ready
      const messageHandler = mockWorkerManager.getMessageHandler();
      
      // Give time for processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockWorkerManager.initialize).toHaveBeenCalled();
    });

    test('should queue and process bestmove request', async () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(true);
      
      const engine = Engine.getInstance();
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const movePromise = engine.getBestMove(fen, 2000);
      
      // Give time for processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockWorkerManager.sendCommand).toHaveBeenCalledWith(`position fen ${fen}`);
      expect(mockWorkerManager.sendCommand).toHaveBeenCalledWith('go movetime 2000');
    });

    test('should handle request timeout', async () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(true);
      
      const engine = Engine.getInstance();
      const movePromise = engine.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 100);
      
      // Wait for timeout
      const result = await movePromise;
      
      // Should return null on timeout
      expect(result).toBeNull();
    });
  });

  describe('evaluatePosition', () => {
    test('should return default evaluation if worker not ready', async () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(false);
      const originalWindow = global.window;
      delete (global as any).window;
      
      const engine = Engine.getInstance();
      const result = await engine.evaluatePosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      expect(result).toEqual({ score: 0, mate: null });
      
      (global as any).window = originalWindow;
    });

    test('should queue and process evaluation request', async () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(true);
      
      const engine = Engine.getInstance();
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const evalPromise = engine.evaluatePosition(fen);
      
      // Give time for processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockWorkerManager.sendCommand).toHaveBeenCalledWith(`position fen ${fen}`);
      expect(mockWorkerManager.sendCommand).toHaveBeenCalledWith('go depth 15');
    });
  });

  describe('Request Processing', () => {
    test('should process queue sequentially', async () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(true);
      
      const engine = Engine.getInstance();
      
      // Queue multiple requests
      const promise1 = engine.getBestMove('fen1');
      const promise2 = engine.getBestMove('fen2');
      
      // Give time for processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should process first request
      expect(mockWorkerManager.sendCommand).toHaveBeenCalledWith('position fen fen1');
      
      // Simulate completion of first request
      (engine as any).onRequestComplete();
      
      // Give time for next request
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should process second request
      expect(mockWorkerManager.sendCommand).toHaveBeenCalledWith('position fen fen2');
    });

    test('should handle request errors', async () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(true);
      mockWorkerManager.sendCommand.mockImplementation(() => {
        throw new Error('Command failed');
      });
      
      const engine = Engine.getInstance();
      const movePromise = engine.getBestMove('fen1');
      
      const result = await movePromise;
      expect(result).toBeNull();
    });
  });

  describe('Engine Control', () => {
    test('should check if ready', () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(true);
      
      const engine = Engine.getInstance();
      expect(engine.isReady()).toBe(true);
      
      mockWorkerManager.isWorkerReady.mockReturnValue(false);
      expect(engine.isReady()).toBe(false);
    });

    test('should reset engine state', () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(true);
      const messageHandler = { 
        setCurrentRequest: jest.fn(), 
        clearCurrentRequest: jest.fn() 
      };
      mockWorkerManager.getMessageHandler.mockReturnValue(messageHandler);
      
      const engine = Engine.getInstance();
      
      // Queue some requests
      engine.getBestMove('fen1');
      engine.getBestMove('fen2');
      
      engine.reset();
      
      expect(messageHandler.clearCurrentRequest).toHaveBeenCalled();
      expect((engine as any).requestQueue).toHaveLength(0);
    });

    test('should handle reset errors gracefully', () => {
      mockWorkerManager.getMessageHandler.mockImplementation(() => {
        throw new Error('Handler error');
      });
      
      const engine = Engine.getInstance();
      
      // Should not throw
      expect(() => engine.reset()).not.toThrow();
    });

    test('should quit and cleanup', () => {
      const engine = Engine.getInstance();
      
      engine.quit();
      
      expect(mockWorkerManager.cleanup).toHaveBeenCalled();
      expect((Engine as any).instance).toBeNull();
    });

    test('should handle quit errors gracefully', () => {
      mockWorkerManager.cleanup.mockImplementation(() => {
        throw new Error('Cleanup error');
      });
      
      const engine = Engine.getInstance();
      
      // Should not throw
      expect(() => engine.quit()).not.toThrow();
    });

    test('should restart engine', async () => {
      const engine = Engine.getInstance();
      
      const result = await engine.restart();
      
      expect(mockWorkerManager.restart).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should update config', () => {
      const engine = Engine.getInstance();
      const newConfig = { timeout: 5000 };
      
      engine.updateConfig(newConfig);
      
      expect(mockWorkerManager.updateConfig).toHaveBeenCalledWith(newConfig);
    });
  });

  describe('Statistics', () => {
    test('should return engine stats', () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(true);
      const workerStats = { initialized: true, requests: 10 };
      const config = { maxRetries: 3, timeout: 5000 };
      
      mockWorkerManager.getStats.mockReturnValue(workerStats);
      mockWorkerManager.getConfig.mockReturnValue(config);
      
      const engine = Engine.getInstance();
      
      // Queue a request to update counter
      engine.getBestMove('fen1');
      
      const stats = engine.getStats();
      
      expect(stats).toEqual({
        isReady: true,
        queueLength: expect.any(Number),
        isProcessing: expect.any(Boolean),
        requestCounter: expect.any(Number),
        workerStats,
        config
      });
      
      expect(stats.requestCounter).toBeGreaterThan(0);
    });
  });

  describe('Concurrent Requests', () => {
    test('should handle multiple concurrent requests', async () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(true);
      
      const engine = Engine.getInstance();
      
      // Create multiple requests
      const promises = [
        engine.getBestMove('fen1'),
        engine.evaluatePosition('fen2'),
        engine.getBestMove('fen3')
      ];
      
      // Give time for initial processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify queue handling
      const stats = engine.getStats();
      expect(stats.queueLength).toBeGreaterThanOrEqual(0);
      expect(stats.isProcessing).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty FEN', async () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(true);
      
      const engine = Engine.getInstance();
      const result = await engine.getBestMove('');
      
      // Should still process (validation happens elsewhere)
      expect(mockWorkerManager.sendCommand).toHaveBeenCalledWith('position fen ');
    });

    test('should generate unique request IDs', () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(true);
      
      const engine = Engine.getInstance();
      
      // Create multiple requests
      engine.getBestMove('fen1');
      engine.getBestMove('fen2');
      
      const stats = engine.getStats();
      expect(stats.requestCounter).toBe(2);
    });

    test('should handle worker not ready after lazy init', async () => {
      mockWorkerManager.isWorkerReady.mockReturnValue(false);
      mockWorkerManager.initialize.mockResolvedValue(false);
      
      const engine = Engine.getInstance();
      const result = await engine.getBestMove('fen');
      
      expect(result).toBeNull();
    });
  });
});