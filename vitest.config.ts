import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { sharedDir, testsDir, srcDir, domainsDir } from './config/paths';

/**
 * Vitest Root Configuration with Projects
 * Replaces deprecated vitest.workspace.ts
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
    // Define projects (replaces workspace file)
    // In Vitest v3, projects should reference config files or patterns
    projects: [
      './config/testing/vitest.chess-core.config.ts',
      './config/testing/vitest.tablebase.config.ts',
      './config/testing/vitest.training.config.ts',
      './config/testing/vitest.shared.config.ts',
      './config/testing/vitest.domains.config.ts',
      './config/testing/vitest.integration.config.ts',
    ],
  },
});