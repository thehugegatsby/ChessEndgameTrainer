import { defineConfig, mergeConfig } from 'vitest/config';
import { featuresDir } from '../paths';
import baseConfig from '../../vitest.base.config';

/**
 * Vitest Chess Core Project Configuration
 *
 * Merges the base configuration with chess-core-specific settings.
 * This ensures Observer API mocks are properly loaded from the shared setupFiles.
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'chess-core',
      include: [`${featuresDir}/chess-core/**/*.{test,spec}.{ts,tsx}`],
      exclude: ['node_modules', 'dist', '.next', '**/node_modules/**'],
    },
  })
);
