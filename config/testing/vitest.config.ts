import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { featuresTestSetup, featuresDir, srcDir, sharedDir, testsDir } from '../paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      path.resolve(testsDir, 'setup/observer-polyfill.ts'), // MUST be first!
      path.resolve(testsDir, 'utils/vitestSetup.ts'), // Next.js mocks
      featuresTestSetup
    ],
    include: [
      `${featuresDir}/**/*.{test,spec}.{ts,tsx}`,
      `${testsDir}/**/*.{test,spec}.{ts,tsx}`,
      `${testsDir}/**/*.test.ts`,
      `${testsDir}/**/*.test.tsx`
    ],
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