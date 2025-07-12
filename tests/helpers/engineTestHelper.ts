/**
 * @fileoverview Engine Test Helper
 * @description Utilities for testing Engine components with proper isolation
 */

// Import types for TypeScript, these are not affected by Jest mocking
import type { EngineConfig } from '@shared/lib/chess/engine/types';
import type { WorkerConfig } from '@shared/lib/chess/engine/interfaces';
import { MockWorkerFactory, MockWorker, createStockfishMockWorker } from './mockWorker';

// Import real Engine class directly from index
import { Engine } from '@shared/lib/chess/engine/index';


/**
 * Test Engine Configuration
 * Optimized for fast test execution
 */
export const TEST_ENGINE_CONFIG: EngineConfig = {
  maxDepth: 10,        // Reduced for tests
  maxTime: 100,        // Fast timeouts
  maxNodes: 10000,     // Limited nodes
  useThreads: 1,       // Single thread
  hashSize: 1,         // Minimal memory
  skillLevel: 20,      // Full strength
};

/**
 * Active test engines tracker
 * Ensures proper cleanup after tests
 */
const activeEngines = new Set<Engine>();

/**
 * Creates a test engine with mock worker
 * @param config Optional engine configuration overrides
 * @param workerBehavior Optional worker behavior configuration
 * @param options Optional test configuration
 * @returns Object with engine instance and mock worker factory
 */
export async function createTestEngine(config?: Partial<EngineConfig>, workerBehavior?: {
  autoRespond?: boolean;
  responseDelay?: number;
  failOnInit?: boolean;
  customResponses?: Map<string, string[]>;
}, options?: {
  throwOnInitError?: boolean;
}) {
  // Create mock worker factory
  const mockFactory = new MockWorkerFactory();
  
  // Pre-create and configure the worker that will be used
  let mockWorker: MockWorker | null = null;
  
  // Override factory to return our pre-configured worker
  const originalCreateWorker = mockFactory.createWorker.bind(mockFactory);
  mockFactory.createWorker = (scriptURL: string | URL) => {
    if (!mockWorker) {
      // Use original method which adds to workers array
      mockWorker = originalCreateWorker(scriptURL) as MockWorker;
      
      // Apply worker behavior configuration
      if (workerBehavior) {
        if (workerBehavior.autoRespond !== undefined) {
          mockWorker.setAutoRespond(workerBehavior.autoRespond);
        }
        
        if (workerBehavior.responseDelay !== undefined) {
          mockWorker.setResponseDelay(workerBehavior.responseDelay);
        }
        
        if (workerBehavior.customResponses) {
          workerBehavior.customResponses.forEach((responses, command) => {
            mockWorker!.addResponse(command, responses);
          });
        }
        
        if (workerBehavior.failOnInit) {
          // Override UCI response to simulate init failure
          mockWorker.addResponse('uci', ['uciok']); // UCI should succeed
          // Respond with error to isready to trigger immediate failure
          mockWorker.addResponse('isready', ['error: initialization failed']);
        }
      }
    }
    
    return mockWorker;
  };
  
  // Configure worker config
  const workerConfig: WorkerConfig = {
    workerFactory: mockFactory,
    workerPath: '/test-stockfish.js',
    allowedPaths: ['/test-stockfish.js'],
  };

  // Create engine with test config
  const engineConfig = { ...TEST_ENGINE_CONFIG, ...config };
  const engine = new Engine(engineConfig, workerConfig);
  
  // Track for cleanup immediately
  activeEngines.add(engine);

  // Wait for engine initialization to complete
  try {
    await engine.waitForReady();
    
    // After initialization, get the mock worker from the factory
    mockWorker = mockFactory.getLastWorker();
    
    if (!mockWorker) {
      throw new Error('MockWorker was not created after engine initialization. Check engine setup.');
    }
    
  } catch (error) {
    // Handle initialization failure
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Engine initialization failed in test: ${errorMessage}`);
    
    if (options?.throwOnInitError) {
      throw new Error(`Test engine initialization failed: ${errorMessage}`);
    }
    // If not throwing, continue with potentially non-functional engine for cleanup testing
  }

  return {
    engine,
    mockFactory,
    mockWorker: mockWorker!,
    getMockWorker: () => mockWorker!,
    cleanup: () => cleanupEngine(engine),
  };
}

/**
 * Creates a test engine with realistic Stockfish behavior
 */
export async function createRealisticTestEngine(config?: Partial<EngineConfig>, options?: {
  throwOnInitError?: boolean;
}) {
  const mockFactory = new MockWorkerFactory();
  
  // Pre-create the realistic worker
  let mockWorker: MockWorker | null = null;
  
  // Override factory to create realistic worker
  const originalCreateWorker = mockFactory.createWorker.bind(mockFactory);
  mockFactory.createWorker = (scriptURL: string | URL) => {
    if (!mockWorker) {
      // Create the realistic worker
      mockWorker = createStockfishMockWorker();
      // Add it to the factory's workers array
      mockFactory.workers.push(mockWorker);
    }
    return mockWorker;
  };

  const workerConfig: WorkerConfig = {
    workerFactory: mockFactory,
    workerPath: '/test-stockfish.js',
    allowedPaths: ['/test-stockfish.js'],
  };

  const engineConfig = { ...TEST_ENGINE_CONFIG, ...config };
  const engine = new Engine(engineConfig, workerConfig);
  
  activeEngines.add(engine);

  // Wait for engine initialization to complete
  try {
    await engine.waitForReady();
  } catch (error) {
    // Handle initialization failure
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Realistic engine initialization failed in test: ${errorMessage}`);
    
    if (options?.throwOnInitError) {
      throw new Error(`Test engine initialization failed: ${errorMessage}`);
    }
  }

  return {
    engine,
    mockFactory,
    getMockWorker: () => mockWorker || mockFactory.getLastWorker(),
    cleanup: () => cleanupEngine(engine),
  };
}

/**
 * Cleans up a test engine
 * @param engine Engine instance to clean up
 */
export function cleanupEngine(engine: Engine): void {
  try {
    engine.quit();
  } catch (error) {
    // Ignore cleanup errors in tests
  } finally {
    activeEngines.delete(engine);
  }
}

/**
 * Cleans up all active test engines
 * Call this in afterAll() to ensure cleanup
 */
export function cleanupAllEngines(): void {
  const engines = Array.from(activeEngines);
  engines.forEach(cleanupEngine);
  activeEngines.clear();
}

/**
 * Test helper to wait for engine initialization using event-driven approach
 * @param engine Engine instance
 * @param timeout Maximum wait time in ms (fallback only)
 */
export async function waitForEngineReady(engine: Engine, timeout: number = 5000): Promise<boolean> {
  try {
    // First try the event-driven approach
    if (typeof (engine as any).waitForReadyEvent === 'function') {
      // Use the new event-driven method
      await (engine as any).waitForReadyEvent();
      return true;
    } else {
      // Fallback to promise-based approach for compatibility
      await Promise.race([
        engine.waitForReady(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      return true;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Helper to simulate engine responses
 */
export class EngineTestScenario {
  private mockWorker: MockWorker;

  constructor(mockWorker: MockWorker) {
    this.mockWorker = mockWorker;
  }

  /**
   * Simulates a successful best move response
   */
  async simulateBestMove(move: string = 'e2e4', delay: number = 50): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delay));
    this.mockWorker.triggerResponse(`bestmove ${move}`);
  }

  /**
   * Simulates a successful evaluation
   */
  async simulateEvaluation(score: number = 30, depth: number = 15, delay: number = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delay));
    this.mockWorker.triggerResponse(`info depth ${depth} score cp ${score}`);
    this.mockWorker.triggerResponse(`bestmove e2e4`);
  }

  /**
   * Simulates an engine error
   */
  simulateError(message: string = 'Engine crashed'): void {
    this.mockWorker.triggerError(message);
  }

  /**
   * Gets the message queue for verification
   */
  getMessageQueue(): string[] {
    return this.mockWorker.getMessageQueue();
  }

  /**
   * Verifies a command was sent
   */
  expectCommand(command: string): boolean {
    return this.getMessageQueue().some(msg => msg.includes(command));
  }
}

/**
 * Jest test utilities
 */
export const engineTestUtils = {
  /**
   * Use in beforeEach to set up engine
   */
  beforeEach() {
    // Clear any lingering engines
    cleanupAllEngines();
  },

  /**
   * Use in afterEach for cleanup
   */
  afterEach() {
    cleanupAllEngines();
  },

  /**
   * Creates a test suite for engine functionality
   */
  describeEngine(name: string, fn: () => void) {
    describe(name, () => {
      beforeEach(() => engineTestUtils.beforeEach());
      afterEach(() => engineTestUtils.afterEach());
      fn();
    });
  },
};