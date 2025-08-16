import { defineConfig, mergeConfig } from 'vitest/config';
import { sharedDir } from '../paths';
import baseConfig from '../../vitest.base.config';

/**
 * Vitest Shared Project Configuration
 *
 * Merges the base configuration with shared-specific settings.
 * This ensures Observer API mocks are properly loaded from the shared setupFiles.
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'shared',
      include: [`${sharedDir}/**/*.{test,spec}.{ts,tsx}`, `src/app/**/*.{test,spec}.{ts,tsx}`],
      exclude: ['node_modules', 'dist', '.next', '**/node_modules/**'],
    },
  })
);
