import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { featuresTestSetup, featuresDir, srcDir, sharedDir } from '../paths';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: featuresTestSetup,
    include: [`${featuresDir}/**/*.{test,spec}.{ts,tsx}`],
    exclude: ['node_modules', 'dist', '.next'],
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
      '@lib': `${srcDir}/lib`,
      '@shared': sharedDir,
      '@': srcDir,
    },
  },
});