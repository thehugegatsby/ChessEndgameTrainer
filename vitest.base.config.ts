import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { sharedDir, testsDir, srcDir, domainsDir } from './config/paths';

/**
 * Vitest Base Configuration
 *
 * This configuration is shared across all Vitest projects to ensure:
 * - Consistent Observer API mocks (ResizeObserver, IntersectionObserver)
 * - Proper React/DOM environment setup
 * - Shared test utilities and setup files
 *
 * Each project config should import and merge this base configuration.
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@lib': path.resolve(srcDir, 'lib'),
      '@shared': sharedDir,
      '@domains': domainsDir,
      '@tests': testsDir,
      '@': srcDir,
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  test: {
    // Global test configuration shared across all projects
    globals: true,
    environment: 'happy-dom',

    // Critical: setupFiles must be loaded in EVERY project to ensure Observer mocks work
    setupFiles: [path.resolve(__dirname, './src/tests/setup/global-observer-setup.ts')],

    // Shared test configuration
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,
        minForks: 1,
      },
    },
    isolate: true,

    // Coverage configuration shared across all projects
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
});
