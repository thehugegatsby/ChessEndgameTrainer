import { execSync } from 'child_process';
import os from 'os';

/**
 * WSL2 Test Configuration Utilities
 * 
 * Centralizes WSL2 detection and optimal test configuration.
 * Replaces scattered environment variable checks with type-safe detection.
 */

/**
 * Detects if the current process is running inside Windows Subsystem for Linux (WSL2)
 * 
 * Uses multiple detection methods for reliability:
 * 1. WSL_DISTRO_NAME environment variable (primary)
 * 2. Kernel version check for 'microsoft' (fallback)
 */
export const isWSL2 = (): boolean => {
  // Primary detection: WSL sets this environment variable
  if (process.env.WSL_DISTRO_NAME !== undefined) {
    return true;
  }

  // Fallback detection: Check kernel version for Microsoft WSL signature
  if (process.platform === 'linux') {
    try {
      const kernelVersion = execSync('uname -r', { encoding: 'utf8', timeout: 1000 });
      return kernelVersion.toLowerCase().includes('microsoft');
    } catch {
      // If uname fails, assume not WSL
      return false;
    }
  }

  return false;
};

/**
 * Returns optimal Vitest configuration based on the current environment
 * 
 * WSL2 Configuration:
 * - Uses 'forks' pool (better for WSL2 file system performance)
 * - Limits workers to prevent resource contention
 * 
 * Native Configuration:
 * - Uses 'threads' pool (faster for native Linux/macOS/Windows)
 * - No worker limits (utilizes all available CPU cores)
 */
export const getOptimalVitestConfig = () => {
  if (isWSL2()) {
    const cpuCount = os.cpus().length;
    const maxWorkers = Math.max(1, Math.floor(cpuCount / 2)); // Conservative for WSL2
    
    console.log(`🐧 WSL2 detected: Optimizing for ${cpuCount} CPUs (max workers: ${maxWorkers})`);
    
    return {
      pool: 'forks' as const,
      poolOptions: {
        forks: {
          maxForks: maxWorkers,
          minForks: 1,
        },
      },
    };
  }

  // Native environment: Use high-performance configuration
  const cpuCount = os.cpus().length;
  console.log(`🚀 Native environment detected: Using all ${cpuCount} CPU cores`);
  
  return {
    pool: 'threads' as const,
    poolOptions: {
      threads: {
        maxThreads: cpuCount,
        minThreads: 1,
      },
    },
  };
};

/**
 * Legacy compatibility: Check if environment variables from smart-test.js are set
 * 
 * This function can be used during transition to ensure backward compatibility
 * with the existing smart-test.js script.
 */
export const hasLegacyWSLConfig = (): boolean => {
  return !!(
    process.env.VITEST_POOL === 'forks' || 
    process.env.VITEST_MAX_FORKS || 
    process.env.VITEST_MAX_THREADS
  );
};