/**
 * @fileoverview Singleton Engine Instance for Production Use
 * @description Provides a single global instance of the Chess Engine
 * 
 * This module exports a pre-instantiated Engine for use throughout
 * the application, maintaining the singleton pattern at the module level
 * rather than within the class itself.
 * 
 * USAGE:
 * ```typescript
 * import { engine } from '@shared/lib/chess/engine/singleton';
 * const bestMove = await engine.getBestMove(fen);
 * ```
 * 
 * CLEANUP:
 * Call engine.quit() when done to free memory (especially on mobile)
 * 
 * TEST USAGE:
 * Tests should NOT import from this file. Instead:
 * ```typescript
 * import { Engine } from '@shared/lib/chess/engine';
 * const testEngine = new Engine();
 * ```
 */

import { Engine } from './index';
import { Logger } from '@shared/services/logging/Logger';

const logger = new Logger();

/**
 * Lazy-initialized singleton instance
 * Prevents engine initialization during build process
 */
let engineInstance: Engine | null = null;

/**
 * Get the global singleton instance of the Chess Engine
 * Lazily initializes on first access to prevent build issues
 * 
 * @returns The singleton Engine instance
 * @throws Error if called outside browser context
 */
export function getEngine(): Engine {
  if (!engineInstance) {
    // Only initialize in browser context
    if (typeof window === 'undefined') {
      throw new Error('Engine can only be initialized in browser context');
    }
    engineInstance = new Engine();
  }
  return engineInstance;
}

/**
 * @deprecated Direct access to engine instance - use getEngine() instead
 * This export is kept for backward compatibility but will be removed
 */
export const engine = new Proxy({} as Engine, {
  get(target, prop) {
    logger.warn('Direct engine access is deprecated. Use getEngine() instead.');
    return getEngine()[prop as keyof Engine];
  }
});

/**
 * Graceful shutdown handler for async cleanup
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Shutting down engine gracefully...`);
  
  try {
    // Only quit if engine was initialized
    if (engineInstance) {
      engineInstance.quit();
      logger.info('Engine cleanup completed');
    }
    
    if (typeof process !== 'undefined') {
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error during engine cleanup:', error);
    if (typeof process !== 'undefined') {
      process.exit(1);
    }
  }
};

/**
 * Browser environment cleanup
 */
if (typeof window !== 'undefined') {
  // Synchronous cleanup for browser unload
  window.addEventListener('beforeunload', () => {
    try {
      if (engineInstance) {
        engineInstance.quit();
      }
    } catch (error) {
      logger.error('Browser cleanup error:', error);
    }
  });
  
  // Mobile app visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Log for monitoring but don't quit - too aggressive
      logger.debug('App went to background');
    }
  });
}

/**
 * Node.js environment cleanup
 */
if (typeof process !== 'undefined' && process.on) {
  // Handle termination signals properly
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  // Uncaught exceptions - try to cleanup before crash
  process.on('uncaughtException', async (error) => {
    logger.error('Uncaught Exception:', error);
    await gracefulShutdown('uncaughtException');
  });
  
  // Unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise);
    await gracefulShutdown('unhandledRejection');
  });
}