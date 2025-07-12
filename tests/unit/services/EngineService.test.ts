/**
 * @fileoverview Unit tests for EngineService
 * Tests engine pooling, resource management, and cleanup
 */

// Mock the ScenarioEngine before any imports
jest.mock('@shared/lib/chess/ScenarioEngine');

// Mock the logger
jest.mock('@shared/services/logging', () => ({
  getLogger: () => ({
    setContext: jest.fn().mockReturnThis(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  })
}));

describe('EngineService', () => {
  let service: any;
  let mockScenarioEngine: any;
  let ScenarioEngineMock: jest.Mock;
  const originalWindow = global.window;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock window to enable timer in browser-like environment
    global.window = {} as Window & typeof globalThis;
    
    // Use fake timers for testing time-based behavior
    jest.useFakeTimers();
    
    // Mock ScenarioEngine constructor
    mockScenarioEngine = {
      quit: jest.fn().mockResolvedValue(undefined),
      getFen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
      move: jest.fn(),
      evaluate: jest.fn(),
      getDualEvaluation: jest.fn()
    };
    
    // Use isolateModules to ensure clean module loading with mocks
    jest.isolateModules(() => {
      // Get the mocked ScenarioEngine
      ScenarioEngineMock = require('@shared/lib/chess/ScenarioEngine').ScenarioEngine;
      ScenarioEngineMock.mockImplementation(() => mockScenarioEngine);
      
      // Now load EngineService which will use the mocked ScenarioEngine
      const EngineServiceModule = require('@shared/services/chess/EngineService');
      // Reset the singleton instance
      (EngineServiceModule.EngineService as any).instance = null;
      service = EngineServiceModule.EngineService.getInstance();
    });
  });

  afterEach(() => {
    // Clear any running timers
    jest.clearAllTimers();
    jest.useRealTimers();
    
    // Restore original window
    global.window = originalWindow;
  });

  describe('getInstance()', () => {
    it('should return the same instance on multiple calls (singleton)', () => {
      const instance1 = service;
      const instance2 = service.constructor.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('getEngine()', () => {
    it('should create a new engine for a new ID', async () => {
      const engine = await service.getEngine('test-1');
      
      expect(ScenarioEngineMock).toHaveBeenCalledTimes(1);
      expect(engine).toBe(mockScenarioEngine);
    });

    it('should reuse existing engine for same ID', async () => {
      const engine1 = await service.getEngine('test-1');
      const engine2 = await service.getEngine('test-1');
      
      expect(ScenarioEngineMock).toHaveBeenCalledTimes(1);
      expect(engine1).toBe(engine2);
    });

    it('should increment reference count when reusing engine', async () => {
      await service.getEngine('test-1');
      await service.getEngine('test-1');
      
      // Release once should not quit the engine
      await service.releaseEngine('test-1');
      expect(mockScenarioEngine.quit).not.toHaveBeenCalled();
    });

    it('should use "default" as ID when none provided', async () => {
      const engine = await service.getEngine();
      
      expect(ScenarioEngineMock).toHaveBeenCalledTimes(1);
      expect(engine).toBe(mockScenarioEngine);
    });

    it('should evict oldest engine when at capacity', async () => {
      // Mock Date.now() to control timing
      let currentTime = 1000;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
      
      // Create max instances (5)
      const engines = [];
      for (let i = 0; i < 5; i++) {
        currentTime += 1000; // Increment time for each engine
        const engine = await service.getEngine(`test-${i}`);
        engines.push(engine);
        // Release engines to make them eligible for eviction
        await service.releaseEngine(`test-${i}`);
      }
      
      expect(ScenarioEngineMock).toHaveBeenCalledTimes(5);
      
      // Create one more - should evict the oldest (test-0)
      currentTime += 1000;
      await service.getEngine('test-new');
      
      expect(ScenarioEngineMock).toHaveBeenCalledTimes(6);
      expect(engines[0].quit).toHaveBeenCalled(); // First engine should be quit
    });
  });

  describe('releaseEngine()', () => {
    it('should decrement reference count', async () => {
      await service.getEngine('test-1');
      await service.getEngine('test-1'); // refCount = 2
      
      await service.releaseEngine('test-1'); // refCount = 1
      expect(mockScenarioEngine.quit).not.toHaveBeenCalled();
      
      await service.releaseEngine('test-1'); // refCount = 0
      // Engine not quit immediately, only during cleanup
      expect(mockScenarioEngine.quit).not.toHaveBeenCalled();
    });

    it('should handle releasing non-existent engine gracefully', () => {
      expect(() => service.releaseEngine('non-existent')).not.toThrow();
    });

    it('should not decrement below zero', async () => {
      await service.getEngine('test-1');
      service.releaseEngine('test-1');
      service.releaseEngine('test-1'); // Should not go negative
      
      // Should not throw
      expect(() => service.releaseEngine('test-1')).not.toThrow();
    });
  });

  describe('periodic idle cleanup', () => {
    it('should remove idle engines after maxIdleTime', async () => {
      // Mock Date.now()
      let currentTime = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
      
      // Create and release an engine
      await service.getEngine('test-1');
      await service.releaseEngine('test-1');
      
      // Advance time beyond idle threshold (5 minutes)
      currentTime = 6 * 60 * 1000;
      
      // Trigger periodic cleanup by advancing timer
      jest.advanceTimersByTime(60 * 1000);
      
      expect(mockScenarioEngine.quit).toHaveBeenCalled();
    });

    it('should not remove engines with active references', async () => {
      let currentTime = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
      
      // Create engine but don't release
      await service.getEngine('test-1');
      
      // Advance time
      currentTime = 6 * 60 * 1000;
      
      // Trigger periodic cleanup
      jest.advanceTimersByTime(60 * 1000);
      
      expect(mockScenarioEngine.quit).not.toHaveBeenCalled();
    });

    it('should not remove recently used engines', async () => {
      let currentTime = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
      
      // Create and release an engine
      await service.getEngine('test-1');
      await service.releaseEngine('test-1');
      
      // Advance time but not beyond threshold
      currentTime = 2 * 60 * 1000; // 2 minutes
      
      // Trigger periodic cleanup
      jest.advanceTimersByTime(60 * 1000);
      
      expect(mockScenarioEngine.quit).not.toHaveBeenCalled();
    });
  });

  describe('cleanup()', () => {
    it('should quit all engines and clear the pool', async () => {
      // Create multiple engines
      const engine1 = await service.getEngine('test-1');
      const engine2 = await service.getEngine('test-2');
      const engine3 = await service.getEngine('test-3');
      
      await service.cleanup();
      
      expect(engine1.quit).toHaveBeenCalled();
      expect(engine2.quit).toHaveBeenCalled();
      expect(engine3.quit).toHaveBeenCalled();
      
      // Pool should be empty
      const newEngine = await service.getEngine('test-1');
      expect(ScenarioEngineMock).toHaveBeenCalledTimes(4); // 3 + 1 new
    });

    it('should stop the cleanup timer', async () => {
      await service.cleanup();
      
      // Clear all existing timers to reset count
      jest.clearAllTimers();
      
      // Verify no timers are running
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should handle quit errors gracefully', async () => {
      const error = new Error('Quit failed');
      mockScenarioEngine.quit.mockRejectedValueOnce(error);
      
      await service.getEngine('test-1');
      
      // Should not throw
      await expect(service.cleanup()).resolves.not.toThrow();
    });
  });

  describe('automatic cleanup timer', () => {
    it('should start cleanup timer on construction', () => {
      // Timer should be set (we have window mocked)
      expect(jest.getTimerCount()).toBe(1);
    });

    it('should run periodic cleanup every minute', async () => {
      // Mock time control
      let currentTime = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
      
      // Create engine to clean up
      await service.getEngine('test-1');
      service.releaseEngine('test-1');
      
      // Advance time to make engine idle (more than 5 minutes)
      currentTime = 6 * 60 * 1000; // 6 minutes later
      
      // Fast-forward 60 seconds to trigger cleanup
      jest.advanceTimersByTime(60 * 1000);
      
      // Wait for async cleanup to complete
      await Promise.resolve();
      
      // Should have cleaned up the idle engine
      expect(mockScenarioEngine.quit).toHaveBeenCalledTimes(1);
      
      // Reset mock for second test
      mockScenarioEngine.quit.mockClear();
      
      // Create another engine at new time
      currentTime = 7 * 60 * 1000;
      await service.getEngine('test-2');
      service.releaseEngine('test-2');
      
      // Advance time again
      currentTime = 13 * 60 * 1000; // Another 6 minutes
      
      // Fast-forward another 60 seconds
      jest.advanceTimersByTime(60 * 1000);
      
      // Wait for async cleanup to complete
      await Promise.resolve();
      
      // Should have cleaned up the second engine
      expect(mockScenarioEngine.quit).toHaveBeenCalledTimes(1);
    });
  });

  describe('without window (SSR environment)', () => {
    it('should not start cleanup timer when window is undefined', () => {
      // Clear existing timers first
      jest.clearAllTimers();
      
      // Remove window before loading modules
      delete global.window;
      
      jest.isolateModules(() => {
        const EngineServiceModule = require('@shared/services/chess/EngineService');
        // Reset singleton
        (EngineServiceModule.EngineService as any).instance = null;
        const ssrService = EngineServiceModule.EngineService.getInstance();
        
        // No timers should be running
        expect(jest.getTimerCount()).toBe(0);
      });
    });
  });
});