import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { featuresTestSetup, featuresDir, srcDir, sharedDir, testsDir } from '../paths';

// WSL2 Detection
const isWSL2 = process.env.WSL_DISTRO_NAME !== undefined;

/**
 * Vitest Configuration with PROJECTS
 *
 * Feature-based project organization for targeted test runs:
 * - pnpm test --project chess-core
 * - pnpm test --project tablebase
 * - pnpm test --project training
 * - pnpm test --project shared
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Define projects for feature-based testing
    projects: [
      {
        name: 'chess-core',
        testMatch: [`${featuresDir}/chess-core/**/*.{test,spec}.{ts,tsx}`],
      },
      {
        name: 'tablebase',
        testMatch: [`${featuresDir}/tablebase/**/*.{test,spec}.{ts,tsx}`],
      },
      {
        name: 'training',
        testMatch: [`${featuresDir}/training/**/*.{test,spec}.{ts,tsx}`],
      },
      {
        name: 'move-quality',
        testMatch: [`${featuresDir}/move-quality/**/*.{test,spec}.{ts,tsx}`],
      },
      {
        name: 'shared',
        testMatch: [`${sharedDir}/**/*.{test,spec}.{ts,tsx}`],
      },
      {
        name: 'integration',
        testMatch: [`${testsDir}/integration/**/*.{test,spec}.{ts,tsx}`],
      },
    ],

    // Global test settings
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      path.resolve(testsDir, 'setup/observer-polyfill.ts'), // MUST be first!
      featuresTestSetup,
      path.resolve(testsDir, 'utils/vitestSetup.ts'),
    ],

    // WSL2-OPTIMIZED PERFORMANCE SETTINGS
    pool: isWSL2 ? 'forks' : 'threads',
    poolOptions: {
      threads: {
        maxThreads: isWSL2 ? 2 : 4,
        minThreads: 1,
      },
      forks: {
        maxForks: isWSL2 ? 2 : 4,
        minForks: 1,
        isolate: true,
      },
    },

    testTimeout: 10000,
    maxWorkers: isWSL2 ? 2 : 4,
    fileParallelism: !isWSL2,

    // Enhanced coverage configuration
    coverage: {
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.mock.{ts,tsx}',
        '**/test-*.{ts,tsx}',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/coverage/**',
        '**/test-utils/**',
        '**/TestFixtures.ts',
        '**/mocks/**',
        '**/fixtures/**',
        '**/*.d.ts',
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
