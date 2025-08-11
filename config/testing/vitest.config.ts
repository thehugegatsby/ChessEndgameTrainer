import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './src/features/test-setup.ts',
    include: ['src/features/**/*.{test,spec}.{ts,tsx}'],
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
      '@features': path.resolve(__dirname, './src/features'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});