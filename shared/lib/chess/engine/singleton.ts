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

const logger = new Logger('EngineSingleton');

/**
 * Global singleton instance of the Chess Engine
 * Initialized on first import (lazy loading)
 */
export const engine = new Engine();

/**
 * Graceful shutdown handler for async cleanup
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Shutting down engine gracefully...`);
  
  try {
    // quit() is synchronous in current implementation
    engine.quit();
    logger.info('Engine cleanup completed');
    
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
      engine.quit();
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
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await gracefulShutdown('unhandledRejection');
  });
}