import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { featuresDir, sharedDir, testsDir, srcDir } from './config/paths';

/**
 * Vitest Root Configuration with Projects
 * Replaces deprecated vitest.workspace.ts
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
  test: {
    // Define projects (replaces workspace file)
    projects: [
      {
        name: 'chess-core',
        extends: './config/testing/vitest.unit.config.ts',
        test: {
          include: [`${featuresDir}/chess-core/**/*.{test,spec}.{ts,tsx}`],
        },
      },
      {
        name: 'tablebase',
        extends: './config/testing/vitest.unit.config.ts',
        test: {
          include: [`${featuresDir}/tablebase/**/*.{test,spec}.{ts,tsx}`],
        },
      },
      {
        name: 'training',
        extends: './config/testing/vitest.unit.config.ts',
        test: {
          include: [`${featuresDir}/training/**/*.{test,spec}.{ts,tsx}`],
        },
      },
      {
        name: 'move-quality',
        extends: './config/testing/vitest.unit.config.ts',
        test: {
          include: [`${featuresDir}/move-quality/**/*.{test,spec}.{ts,tsx}`],
        },
      },
      {
        name: 'shared',
        extends: './config/testing/vitest.unit.config.ts',
        test: {
          include: [
            `${sharedDir}/**/*.{test,spec}.{ts,tsx}`,
            `src/app/**/*.{test,spec}.{ts,tsx}`
          ],
        },
      },
      {
        name: 'integration',
        extends: './config/testing/vitest.integration.config.ts',
        test: {
          include: [`${testsDir}/integration/**/*.{test,spec}.{ts,tsx}`],
        },
      },
    ],
  },
});