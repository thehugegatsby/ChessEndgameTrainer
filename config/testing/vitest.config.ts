import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { fileURLToPath } from 'url';
import { featuresTestSetup, featuresDir, srcDir, sharedDir, testsDir } from '../paths';

const projectRoot = path.resolve(__dirname, '../../');
console.log('✅ Vitest configuration loaded from: config/testing/vitest.config.ts');
console.log('Project root:', projectRoot);

// WSL2 Detection for optimized performance settings
const isWSL2 = process.env.WSL_DISTRO_NAME !== undefined;

/**
 * Unified Vitest Configuration
 * 
 * Consolidates all test configurations into a single source of truth.
 * Supports both feature-based projects and adaptive WSL2 optimizations.
 */
export default defineConfig({
  root: projectRoot,
  plugins: [
    react(),
    tsconfigPaths({ root: projectRoot }),
  ],
  test: {
    // Alias configuration - CRUCIAL: Must be in test section, not resolve section!
    alias: {
      '@shared': path.resolve(projectRoot, 'src/shared'),
      '@features': path.resolve(projectRoot, 'src/features'), 
      '@tests': path.resolve(projectRoot, 'src/tests'),
      '@': path.resolve(projectRoot, 'src'),
    },
    
    // Feature-based project organization for targeted test runs
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

    // Global test environment settings
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      path.resolve(testsDir, 'setup/observer-polyfill.ts'), // MUST be first!
      featuresTestSetup,
      path.resolve(testsDir, 'utils/vitestSetup.ts'),
    ],

    // Test file inclusion patterns
    include: [
      `${featuresDir}/**/*.{test,spec}.{ts,tsx}`,
      `${testsDir}/**/*.{test,spec}.{ts,tsx}`,
      `${testsDir}/**/*.test.ts`,
      `${testsDir}/**/*.test.tsx`,
      `${sharedDir}/**/*.{test,spec}.{ts,tsx}`,
    ],
    exclude: ['node_modules', 'dist', '.next', '**/node_modules/**'],

    // WSL2-OPTIMIZED PERFORMANCE SETTINGS
    // WSL2 has performance issues with parallel execution, so we use adaptive settings
    pool: isWSL2 ? 'forks' : 'threads',
    poolOptions: {
      threads: {
        maxThreads: isWSL2 ? 2 : 4, // WSL2: Limited threads for stability
        minThreads: 1,
      },
      forks: {
        maxForks: isWSL2 ? 2 : 4, // WSL2: Conservative fork limit
        minForks: 1,
        isolate: true, // Prevents test state leaks between files
      },
    },

    testTimeout: 10000, // Extended timeout for complex async tests
    maxWorkers: isWSL2 ? 2 : 4, // WSL2: Reduced workers to prevent resource contention
    fileParallelism: !isWSL2, // WSL2: Sequential file execution for stability

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
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
});
