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
    // PERFORMANCE OPTIMIZATIONS
    pool: 'vmThreads',  // VM threads for better isolation than threads
    poolOptions: {
      vmThreads: {
        maxMemoryLimitBeforeRecycle: 0.8,  // Recycle worker at 80% memory
        memoryLimit: '1GB',  // Increase memory limit per worker
      }
    },
    isolate: false,   // Run tests in same context (faster)
    testTimeout: 5000,  // Faster timeout for unit tests
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