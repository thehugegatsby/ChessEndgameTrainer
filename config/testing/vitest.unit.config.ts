import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { srcDir, sharedDir, testsDir, domainsDir } from '../paths';

// WSL2 Detection
const isWSL2 = process.env.WSL_DISTRO_NAME !== undefined;

/**
 * Vitest Configuration for UNIT TESTS ONLY
 *
 * Optimized for WSL2 and feature-based testing:
 * - Projects for feature-based test organization
 * - WSL2-optimized pool settings
 * - Smart coverage exclusions
 */
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom', // Browser environment for DOM-dependent tests
    globals: true,
    setupFiles: [
      path.resolve(testsDir, 'setup/observer-polyfill.ts'), // MUST be first!
      path.resolve(testsDir, 'utils/vitestSetup.ts'),
    ],
    include: [
      // Domain tests (unit tests with TDD)
      `${domainsDir}/**/*.{test,spec}.{ts,tsx}`,
      // Shared component tests
      `${sharedDir}/**/*.{test,spec}.{ts,tsx}`,
      // Unit test directory (legacy structure)
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
    // WSL2-OPTIMIZED PERFORMANCE SETTINGS
    pool: isWSL2 ? 'forks' : 'threads', // WSL2: Use forks to avoid pipe issues
    poolOptions: {
      threads: {
        maxThreads: isWSL2 ? 2 : 4, // WSL2: Limit threads
        minThreads: 1,
      },
      forks: {
        maxForks: isWSL2 ? 2 : 4, // WSL2: Conservative fork limit
        minForks: 1,
        isolate: true, // Enable isolation to prevent memory leaks
      },
    },
    testTimeout: 10000, // Extended timeout for complex async tests
    maxWorkers: isWSL2 ? 2 : 4, // WSL2: Limited workers
    fileParallelism: !isWSL2, // WSL2: Sequential execution for stability
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/test-setup.ts',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/coverage/**',
        '**/*.mock.ts',
        '**/*.mock.tsx',
        '**/test-utils/**',
        '**/TestFixtures.ts',
        '**/mocks/**',
      ],
    },
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
});
