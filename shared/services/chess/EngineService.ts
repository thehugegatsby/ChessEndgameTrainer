/**
 * Centralized Engine Management Service
 * Manages Stockfish engine instances with proper cleanup and resource management
 */

import { ScenarioEngine } from '@shared/lib/chess/ScenarioEngine';
import { getLogger } from '@shared/services/logging';

const logger = getLogger().setContext('EngineService');

interface EngineInstance {
  id: string;
  engine: ScenarioEngine;
  lastUsed: number;
  refCount: number;
}

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
   */
  async getEngine(id: string = 'default'): Promise<ScenarioEngine> {
    let engineInstance = this.engines.get(id);

    if (!engineInstance) {
      // Check if we're at max capacity and cleanup until under limit
      while (this.engines.size >= this.maxInstances) {
        await this.cleanupOldest();
      }

      // Create new engine (uses default starting position)
      const engine = new ScenarioEngine();
      engineInstance = {
        id,
        engine,
        lastUsed: Date.now(),
        refCount: 1
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