import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { featuresTestSetup, featuresDir, srcDir, sharedDir, testsDir } from '../paths';

/**
 * Vitest Configuration for UNIT TESTS ONLY
 * 
 * Optimized for speed:
 * - No isolation (tests run in same context)
 * - Threads pool for parallelization
 * - Only unit test directories included
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',  // Browser environment for DOM-dependent tests
    globals: true,
    setupFiles: [featuresTestSetup, path.resolve(testsDir, 'utils/vitestSetup.ts')],
    include: [
      // Feature tests (unit tests with TDD)
      `${featuresDir}/**/*.{test,spec}.{ts,tsx}`,
      // Unit test directory
      `${testsDir}/unit/**/*.{test,spec}.{ts,tsx}`,
    ],
    exclude: [
      'node_modules', 
      'dist', 
      '.next', 
      '**/node_modules/**',
      // Explicitly exclude slow test directories
      `${testsDir}/integration/**`,
      `${testsDir}/e2e/**`,
      `${testsDir}/performance/**`,
      `${testsDir}/smoke/**`,
      // Exclude all other test directories for now
      `${testsDir}/examples/**`,
      `${testsDir}/services/**`,
      `${testsDir}/validation/**`,
      `${testsDir}/api/**`,
      `${testsDir}/components/**`,
      `${testsDir}/pages/**`,
      `${testsDir}/shared/**`,
    ],
    // PERFORMANCE OPTIMIZATIONS - Fix worker issues
    pool: 'forks',  // Use forks instead of threads to avoid IPC issues
    poolOptions: {
      forks: {
        maxForks: 1,  // Only one fork at a time to prevent memory issues
        minForks: 1,
        isolate: false,  // No isolation - reuse same context
      }
    },
    // Remove isolate setting - let Vitest handle it
    testTimeout: 5000,  // Faster timeout for unit tests
    maxWorkers: 1,  // Only one worker to prevent memory issues
    fileParallelism: false,  // Run files sequentially
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/test-setup.ts',
        '**/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@features': featuresDir,
      '@lib': path.resolve(srcDir, 'lib'),
      '@shared': sharedDir,
      '@tests': testsDir,
      '@': srcDir,
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
});