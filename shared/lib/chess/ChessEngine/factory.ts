/**
 * @fileoverview ChessEngine Factory & Singleton Management
 * @version 3.0.0 - Architectural Simplification
 * @description Unified singleton pattern consolidating Engine + ScenarioEngine instances
 * 
 * CONSOLIDATION STRATEGY:
 * - Engine: Singleton via separate file + getInstance()
 * - ScenarioEngine: New instances with global counter tracking
 * - ChessEngine: Unified factory pattern with memory management
 * 
 * MOBILE MEMORY MANAGEMENT:
 * - Single ChessEngine instance for optimal performance
 * - Automatic cleanup on app backgrounding/memory pressure
 * - Proper worker termination to prevent memory leaks
 */

import type { 
  IChessEngine, 
  ChessEngineConfig, 
  ChessEngineEvents 
} from './interfaces';

// Forward declaration - actual ChessEngine will be imported lazily
// to avoid circular dependencies during module initialization
type ChessEngineClass = new (config?: ChessEngineConfig) => IChessEngine;

/**
 * Global engine instance for singleton pattern
 * Mobile-optimized: Only one engine instance allowed
 */
let globalChessEngine: IChessEngine | null = null;

/**
 * Engine initialization promise for async singleton access
 * Prevents race conditions during concurrent initialization
 */
let initializationPromise: Promise<IChessEngine> | null = null;

/**
 * Configuration used for current engine instance
 * Enables configuration validation and reuse detection
 */
let currentConfig: ChessEngineConfig | undefined = undefined;

/**
 * Event listeners for engine lifecycle
 * Enables cleanup coordination across components
 */
const eventListeners: Map<keyof ChessEngineEvents, Array<(...args: any[]) => void>> = new Map();

/**
 * Get or create the singleton ChessEngine instance
 * 
 * MOBILE PERFORMANCE: Only one engine instance exists system-wide
 * MEMORY SAFETY: Automatic cleanup prevents worker memory leaks
 * 
 * @param config - Optional configuration for engine initialization
 * @returns Promise resolving to the ChessEngine instance
 */
export async function getChessEngine(config?: ChessEngineConfig): Promise<IChessEngine> {
  // If engine exists and config is compatible, return existing instance
  if (globalChessEngine && isConfigCompatible(config)) {
    return globalChessEngine;
  }
  
  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Clean up existing engine if config has changed
  if (globalChessEngine) {
    await resetChessEngine();
  }
  
  // Start new initialization
  initializationPromise = createNewEngine(config);
  
  try {
    globalChessEngine = await initializationPromise;
    currentConfig = config;
    
    // Set up automatic cleanup listeners
    setupMemoryManagement();
    
    return globalChessEngine;
  } catch (error) {
    // Clean up failed initialization
    initializationPromise = null;
    throw error;
  } finally {
    // Clear initialization promise after completion (success or failure)
    initializationPromise = null;
  }
}

/**
 * Get the ChessEngine instance synchronously
 * WARNING: Only use if you're certain the engine is already initialized
 * 
 * @returns The ChessEngine instance or null if not initialized
 */
export function getChessEngineSync(): IChessEngine | null {
  return globalChessEngine;
}

/**
 * Reset and clean up the ChessEngine instance
 * CRITICAL: Properly terminates Stockfish worker to prevent memory leaks
 * 
 * @returns Promise that resolves when cleanup is complete
 */
export async function resetChessEngine(): Promise<void> {
  if (globalChessEngine) {
    try {
      // Terminate engine worker and clean up resources
      globalChessEngine.quit();
    } catch (error) {
      // Silent cleanup failure - worker may already be terminated
      console.warn('ChessEngine cleanup warning:', error);
    }
    
    globalChessEngine = null;
    currentConfig = undefined;
    
    // Clear event listeners
    eventListeners.clear();
  }
  
  // Cancel any pending initialization
  if (initializationPromise) {
    initializationPromise = null;
  }
}

/**
 * Check if the engine is currently ready for operations
 * 
 * @returns true if engine exists and is ready
 */
export function isChessEngineReady(): boolean {
  return globalChessEngine !== null && 
         (globalChessEngine.isReady?.() ?? true);
}

/**
 * Add event listener for engine lifecycle events
 * 
 * @param event - Event name
 * @param listener - Event handler function
 */
export function addEventListener<K extends keyof ChessEngineEvents>(
  event: K, 
  listener: ChessEngineEvents[K]
): void {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, []);
  }
  eventListeners.get(event)!.push(listener);
}

/**
 * Remove event listener for engine lifecycle events
 * 
 * @param event - Event name
 * @param listener - Event handler function to remove
 */
export function removeEventListener<K extends keyof ChessEngineEvents>(
  event: K, 
  listener: ChessEngineEvents[K]
): void {
  const listeners = eventListeners.get(event);
  if (listeners) {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
}

/**
 * Emit engine lifecycle event to all listeners
 * 
 * @param event - Event name
 * @param args - Event arguments
 */
function emitEvent<K extends keyof ChessEngineEvents>(
  event: K, 
  ...args: Parameters<ChessEngineEvents[K]>
): void {
  const listeners = eventListeners.get(event);
  if (listeners) {
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in ChessEngine event listener for ${event}:`, error);
      }
    });
  }
}

/**
 * Create a new ChessEngine instance
 * Lazy import to avoid circular dependencies
 * 
 * @param config - Engine configuration
 * @returns Promise resolving to new ChessEngine instance
 */
async function createNewEngine(config?: ChessEngineConfig): Promise<IChessEngine> {
  try {
    // Lazy import to avoid circular dependency
    const { ChessEngine } = await import('./index');
    
    const engine = new ChessEngine(config);
    
    // Wait for engine to be ready before returning
    if (engine.isReady && !engine.isReady()) {
      // Engine has async initialization - wait for ready event
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('ChessEngine initialization timeout'));
        }, 10000); // 10 second timeout
        
        const onReady = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        const onFailed = (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        };
        
        // Listen for engine events if available
        addEventListener('ready', onReady);
        addEventListener('init:failed', onFailed);
        
        // Clean up listeners after resolution
        setTimeout(() => {
          removeEventListener('ready', onReady);
          removeEventListener('init:failed', onFailed);
        }, 100);
      });
    }
    
    emitEvent('ready');
    return engine;
    
  } catch (error) {
    const initError = error instanceof Error ? error : new Error(String(error));
    emitEvent('init:failed', initError);
    throw initError;
  }
}

/**
 * Check if new config is compatible with current engine instance
 * Avoids unnecessary engine recreation for minor config changes
 * 
 * @param newConfig - New configuration to check
 * @returns true if configs are compatible
 */
function isConfigCompatible(newConfig?: ChessEngineConfig): boolean {
  // If no current config and no new config, compatible
  if (!currentConfig && !newConfig) {
    return true;
  }
  
  // If one exists but not the other, incompatible
  if (!currentConfig || !newConfig) {
    return false;
  }
  
  // Check critical config fields that require engine restart
  const criticalFields = [
    'engineConfig',
    'workerPath',
    'maxWorkerInstances'
  ] as const;
  
  for (const field of criticalFields) {
    if (JSON.stringify(currentConfig[field]) !== JSON.stringify(newConfig[field])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Set up automatic memory management for mobile devices
 * Registers cleanup handlers for memory pressure and app lifecycle
 */
function setupMemoryManagement(): void {
  // Mobile memory pressure handling
  if (typeof window !== 'undefined') {
    // React Native or mobile browser memory warnings
    const handleMemoryWarning = () => {
      if (globalChessEngine) {
        const stats = globalChessEngine.getStats?.();
        if (stats) {
          emitEvent('memory:warning', stats.cacheSize || 0);
        }
      }
    };
    
    // Listen for memory pressure events
    window.addEventListener?.('memorywarning', handleMemoryWarning);
    
    // Page visibility change (mobile app backgrounding)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App going to background - consider cleanup
        setTimeout(() => {
          if (document.hidden && globalChessEngine) {
            // App has been in background for 30 seconds - clean up
            resetChessEngine().catch(console.warn);
          }
        }, 30000);
      }
    };
    
    document.addEventListener?.('visibilitychange', handleVisibilityChange);
  }
}

/**
 * Development utility: Force engine recreation
 * WARNING: Only use in development/testing
 */
export async function forceRecreateEngine(config?: ChessEngineConfig): Promise<IChessEngine> {
  await resetChessEngine();
  return getChessEngine(config);
}

/**
 * Get current engine statistics (if available)
 * Useful for debugging and performance monitoring
 */
export function getEngineStats() {
  return globalChessEngine?.getStats?.() || null;
}