import { defineConfig, mergeConfig } from 'vitest/config';
import { featuresDir } from '../paths';
import baseConfig from '../../vitest.base.config';

/**
 * Vitest Move Quality Project Configuration
 *
 * Merges the base configuration with move-quality-specific settings.
 * This ensures Observer API mocks are properly loaded from the shared setupFiles.
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'move-quality',
      include: [`${featuresDir}/move-quality/**/*.{test,spec}.{ts,tsx}`],
      exclude: ['node_modules', 'dist', '.next', '**/node_modules/**'],
    },
  })
);
