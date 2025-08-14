import { defineProject } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { featuresTestSetup, featuresDir, srcDir, sharedDir, testsDir } from '../paths';

export default defineProject({
  plugins: [react(), tsconfigPaths()],
  test: {
    name: 'tablebase',
    environment: 'happy-dom',
    globals: true,
    setupFiles: featuresTestSetup,
    include: [`${featuresDir}/tablebase/**/*.{test,spec}.{ts,tsx}`],
    exclude: ['node_modules', 'dist', '.next', '**/node_modules/**'],
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,
        minForks: 1,
      }
    },
    isolate: true,
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