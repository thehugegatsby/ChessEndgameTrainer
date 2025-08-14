import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { featuresTestSetup, featuresDir, srcDir, sharedDir, testsDir } from '../paths';

/**
 * Vitest Configuration for INTEGRATION TESTS ONLY
 * 
 * Optimized for reliability:
 * - Isolation enabled (each test in clean environment)
 * - Forks pool for better isolation
 * - Only integration test directories included
 * - Longer timeouts for API/DB operations
 */
export default defineConfig({
  plugins: [react()],
  test: {
    name: 'integration',
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      path.resolve(testsDir, 'setup/observer-polyfill.ts'), // Still needed for per-test setup
      path.resolve(testsDir, 'utils/vitestSetup.ts'), // Next.js mocks
      featuresTestSetup
    ],
    include: [
      `${testsDir}/integration/**/*.{test,spec}.{ts,tsx}`,
      `${testsDir}/performance/**/*.{test,spec}.{ts,tsx}`,
      `${testsDir}/smoke/**/*.{test,spec}.{ts,tsx}`,
      // Feature-specific integration tests (co-located with features)
      `${featuresDir}/**/__tests__/integration/**/*.{test,spec}.{ts,tsx}`,
    ],
    exclude: [
      'node_modules', 
      'dist', 
      '.next', 
      '**/node_modules/**',
      '**/unit/**',
      '**/e2e/**',
    ],
    // CRITICAL: Disable isolation to fix IntersectionObserver realm issues
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,  // Reduced for stability with shared environment
        minForks: 1,
      }
    },
    isolate: false,  // CHANGED: Share environment to preserve polyfills
    testTimeout: 30000,  // 30 seconds for integration tests
    hookTimeout: 30000,
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