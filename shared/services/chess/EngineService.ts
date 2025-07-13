/**
 * @fileoverview Centralized Engine Management Service
 * @description Manages Stockfish engine instances with proper cleanup and resource management
 * 
 * AI_NOTE: ENGINE POOLING & RESOURCE MANAGEMENT!
 * - Manages up to 5 ScenarioEngine instances (maxInstances)
 * - Automatic cleanup of idle engines after 5 minutes
 * - Reference counting for shared engine usage
 * - Critical for mobile memory management
 * 
 * ARCHITECTURE:
 * - Singleton pattern (again!)
 * - Map-based engine pool with ID keys
 * - Periodic cleanup timer (every 60s)
 * - LRU eviction when at capacity
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Reuses engines instead of creating new ones
 * - Tracks lastUsed for LRU eviction
 * - Reference counting prevents premature cleanup
 * - Automatic idle cleanup reduces memory pressure
 */

import { ScenarioEngine } from '../../lib/chess/ScenarioEngine';
import type { IScenarioEngine } from '../../lib/chess/IScenarioEngine';
import { getLogger } from '../logging';

const logger = getLogger().setContext('EngineService');

interface EngineInstance {
  id: string;
  engine: IScenarioEngine;
  lastUsed: number;
  refCount: number;
}

/**
 * Engine Service Singleton
 * 
 * AI_NOTE: RESOURCE LIMITS & TIMING:
 * - maxInstances = 5: Mobile memory constraint (~100MB total)
 * - maxIdleTime = 5min: Balance between memory and re-init cost
 * - Cleanup runs every 60s (not too aggressive)
 * 
 * USAGE PATTERN:
 * 1. getEngine('training-123') - Gets/creates engine
 * 2. Use engine for moves/evaluation
 * 3. releaseEngine('training-123') - Decrements refCount
 * 4. Auto-cleanup when refCount=0 and idle>5min
 */
export class EngineService {
  private static instance: EngineService;
  private engines: Map<string, EngineInstance> = new Map();
  private readonly maxInstances = 5;
  private readonly maxIdleTime = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanupTimer();
  }

  static getInstance(): EngineService {
    if (!EngineService.instance) {
      EngineService.instance = new EngineService();
    }
    return EngineService.instance;
  }

  /**
   * Get or create an engine instance for a specific context
   * 
   * AI_NOTE: SMART ENGINE REUSE!
   * - Reuses existing engine if available (performance win)
   * - Creates new engine only if needed
   * - Auto-evicts oldest engine when at capacity
   * 
   * TYPICAL IDs:
   * - 'default': General purpose
   * - 'training-{positionId}': Position-specific engine
   * - 'analysis': Deep analysis engine
   * 
   * WARNING: Always call releaseEngine() when done!
   */
  async getEngine(id: string = 'default'): Promise<IScenarioEngine> {
    let engineInstance = this.engines.get(id);

    if (!engineInstance) {
      // AI_NOTE: LRU EVICTION when at capacity!
      // This prevents unbounded memory growth on mobile
      // Prioritizes cleaning up unused engines first
      while (this.engines.size >= this.maxInstances) {
        await this.cleanupOldest();
      }

      // AI_NOTE: NEW ENGINE CREATION
      // ScenarioEngine constructor:
      // - Creates Chess.js instance
      // - Initializes with starting position
      // - Tracks instance for memory management
      // Cost: ~20MB memory + worker initialization time
      
      // Use MockScenarioEngine in E2E test mode for deterministic behavior
      let engine: IScenarioEngine;
      if (process.env.NEXT_PUBLIC_IS_E2E_TEST === 'true') {
        const { MockScenarioEngine } = await import('../../lib/chess/MockScenarioEngine');
        engine = new MockScenarioEngine();
        logger.info(`Created MOCK engine '${id}' for E2E tests`);
      } else {
        engine = new ScenarioEngine();
        logger.info(`Created production ScenarioEngine '${id}'`);
      }
      engineInstance = {
        id,
        engine,
        lastUsed: Date.now(),
        refCount: 1  // Start with 1 reference
      };
      
      this.engines.set(id, engineInstance);
      logger.info(`Created engine '${id}' (total: ${this.engines.size})`);
    } else {
      // Update usage
      engineInstance.lastUsed = Date.now();
      engineInstance.refCount++;
    }

    return engineInstance.engine;
  }

  /**
   * Release an engine reference
   */
  releaseEngine(id: string = 'default'): void {
    const engineInstance = this.engines.get(id);
    if (engineInstance) {
      engineInstance.refCount--;
      engineInstance.lastUsed = Date.now();
      
      if (engineInstance.refCount <= 0) {
        // Engine no longer in use, eligible for cleanup
        logger.debug(`Engine '${id}' released, available for cleanup`);
      }
    }
  }

  /**
   * Force cleanup of a specific engine
   */
  async cleanupEngine(id: string): Promise<void> {
    const engineInstance = this.engines.get(id);
    if (engineInstance) {
      try {
        await engineInstance.engine.quit();
        this.engines.delete(id);
        logger.info(`Cleaned up engine '${id}' (remaining: ${this.engines.size})`);
      } catch (error) {
        logger.warn(`Error cleaning up engine '${id}': ${error}`);
      }
    }
  }

  /**
   * Cleanup the oldest engine (prioritize unused engines)
   * 
   * AI_NOTE: TWO-PASS LRU ALGORITHM!
   * 1st pass: Find oldest UNUSED engine (refCount=0)
   * 2nd pass: If all in use, evict oldest ACTIVE engine
   * 
   * This prevents evicting an active engine when unused ones exist
   * Critical for good UX - don't interrupt active games!
   */
  private async cleanupOldest(): Promise<void> {
    let oldestId = '';
    let oldestTime = Infinity;
    let foundUnused = false;

    // First pass: Find oldest unused engine
    for (const [id, instance] of this.engines) {
      if (instance.refCount <= 0 && instance.lastUsed < oldestTime) {
        oldestTime = instance.lastUsed;
        oldestId = id;
        foundUnused = true;
      }
    }

    // Second pass: If no unused engines, cleanup oldest active engine
    if (!foundUnused) {
      oldestTime = Infinity;
      for (const [id, instance] of this.engines) {
        if (instance.lastUsed < oldestTime) {
          oldestTime = instance.lastUsed;
          oldestId = id;
        }
      }
    }

    if (oldestId) {
      await this.cleanupEngine(oldestId);
    }
  }

  /**
   * Cleanup all idle engines
   */
  private async cleanupIdleEngines(): Promise<void> {
    const now = Date.now();
    const toCleanup: string[] = [];

    for (const [id, instance] of this.engines) {
      const isIdle = instance.refCount <= 0;
      const isOld = (now - instance.lastUsed) > this.maxIdleTime;
      
      if (isIdle && isOld) {
        toCleanup.push(id);
      }
    }

    for (const id of toCleanup) {
      await this.cleanupEngine(id);
    }
  }

  /**
   * Start periodic cleanup timer
   * 
   * AI_NOTE: BROWSER-ONLY TIMER!
   * - Checks typeof window to avoid SSR issues
   * - Runs every 60 seconds (balanced frequency)
   * - Cleans up engines idle for >5 minutes
   * 
   * MEMORY IMPACT:
   * - Each cleanup can free ~20MB per engine
   * - Critical for long-running sessions
   * - Prevents memory leaks from abandoned engines
   */
  private startCleanupTimer(): void {
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupIdleEngines();
      }, 60 * 1000); // Check every minute
    }
  }

  /**
   * Get engine statistics
   */
  getStats(): {
    totalEngines: number;
    activeEngines: number;
    engineIds: string[];
  } {
    const activeEngines = Array.from(this.engines.values()).filter(
      instance => instance.refCount > 0
    ).length;

    return {
      totalEngines: this.engines.size,
      activeEngines,
      engineIds: Array.from(this.engines.keys())
    };
  }

  /**
   * Cleanup all engines (call on app shutdown)
   * 
   * AI_NOTE: CRITICAL CLEANUP METHOD!
   * Call this when:
   * - App is closing/refreshing
   * - User navigates away from training
   * - Memory pressure events
   * - Test teardown
   * 
   * Cleans up:
   * - All engine instances (frees ~100MB total)
   * - Periodic timer (prevents zombie timers)
   * - Worker threads (critical on mobile)
   * 
   * Uses Promise.all for parallel cleanup (faster)
   */
  async cleanup(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    const cleanupPromises = Array.from(this.engines.keys()).map(id => 
      this.cleanupEngine(id)
    );

    await Promise.all(cleanupPromises);
    logger.info('All engines cleaned up');
  }
}