/**
 * @fileoverview Configuration Adapter for E2E Tests
 * @description Transforms simple ModernDriverConfig to complex component-specific configs
 * 
 * Design Decisions:
 * - Adapter Pattern for clean separation of concerns
 * - Factory functions for immutability
 * - Sensible defaults derived from simple config
 * - Type-safe transformations with TypeScript
 */

import { ModernDriverConfig } from '../components/ModernDriver';

/**
 * Configuration structure expected by GamePlayer component
 * This is the target structure we need to create from ModernDriverConfig
 */
export interface GamePlayerConfig {
  baseUrl: string;
  timeouts: {
    default: number;
    navigation: number;
    waitForSelector: number;
    engineResponse: number;
  };
  retries: {
    defaultAttempts: number;
    delayMs: number;
    backoffFactor: number;
  };
  verbose: boolean;
  autoWaitForEngine: boolean;
}

/**
 * Creates a GamePlayerConfig from ModernDriverConfig
 * Maps simple config to complex structure with sensible defaults
 * 
 * @param driverConfig - The simple ModernDriver configuration
 * @returns Fully populated GamePlayerConfig
 * @throws Error if required values (baseUrl) are missing
 */
export function createGamePlayerConfig(driverConfig: Required<ModernDriverConfig>): GamePlayerConfig {
  // Extract values with defaults
  const baseUrl = driverConfig.baseUrl;
  const defaultTimeout = driverConfig.defaultTimeout;
  
  // Derive timeouts from the single defaultTimeout value
  const timeouts = {
    default: defaultTimeout,
    navigation: defaultTimeout * 2,      // Navigation can take longer
    waitForSelector: defaultTimeout,     // Same as default
    engineResponse: 15000              // Engine needs more time (fixed)
  };
  
  // Set sensible retry defaults for E2E tests
  const retries = {
    defaultAttempts: 3,                // Standard retry count
    delayMs: 500,                     // Half second initial delay
    backoffFactor: 1.5                // Exponential backoff
  };
  
  // Derive verbose from test bridge usage (more logging in test mode)
  const verbose = !!driverConfig.useTestBridge;
  
  // Always wait for engine in test environment
  const autoWaitForEngine = true;
  
  return {
    baseUrl,
    timeouts,
    retries,
    verbose,
    autoWaitForEngine
  };
}

/**
 * Configuration cache to avoid repeated transformations
 * Uses WeakMap for automatic garbage collection
 */
const configCache = new WeakMap<ModernDriverConfig, GamePlayerConfig>();

/**
 * Internal implementation with dependency injection for testability
 * @internal - Exported only for testing purposes
 * 
 * @param driverConfig - The simple ModernDriver configuration
 * @param creatorFn - Function to create GamePlayerConfig (injected for testing)
 * @returns Cached or newly created GamePlayerConfig
 */
export function _createGamePlayerConfigCached(
  driverConfig: Required<ModernDriverConfig>,
  creatorFn: (config: Required<ModernDriverConfig>) => GamePlayerConfig
): GamePlayerConfig {
  // Check cache first
  const cached = configCache.get(driverConfig);
  if (cached) {
    return cached;
  }
  
  // Create new config and cache it
  const config = creatorFn(driverConfig);
  configCache.set(driverConfig, config);
  return config;
}

/**
 * Creates a GamePlayerConfig with caching
 * Avoids repeated transformations for the same config object
 * 
 * @param driverConfig - The simple ModernDriver configuration
 * @returns Cached or newly created GamePlayerConfig
 */
export function createGamePlayerConfigCached(driverConfig: Required<ModernDriverConfig>): GamePlayerConfig {
  return _createGamePlayerConfigCached(driverConfig, createGamePlayerConfig);
}

/**
 * Type guard to check if ModernDriverConfig has all required fields
 * Ensures type safety before passing to adapter functions
 */
export function isCompleteModernDriverConfig(
  config: ModernDriverConfig
): config is Required<ModernDriverConfig> {
  return (
    config != null &&
    typeof config === 'object' &&
    config.logger !== undefined &&
    config.defaultTimeout !== undefined &&
    config.baseUrl !== undefined &&
    config.useTestBridge !== undefined
  );
}

/**
 * Helper to create a complete ModernDriverConfig with defaults
 * Useful for tests and when some values might be missing
 */
export function ensureCompleteConfig(config: ModernDriverConfig): Required<ModernDriverConfig> {
  return {
    logger: config.logger!,  // Must be provided by caller
    defaultTimeout: config.defaultTimeout ?? 30000,
    baseUrl: config.baseUrl ?? 'http://localhost:3002',
    useTestBridge: config.useTestBridge ?? true
  };
}