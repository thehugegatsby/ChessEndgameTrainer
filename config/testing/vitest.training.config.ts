import { defineConfig, mergeConfig } from 'vitest/config';
import { domainsDir } from '../paths';
import baseConfig from '../../vitest.base.config';

/**
 * Vitest Training Project Configuration
 *
 * Merges the base configuration with training-specific settings.
 * This ensures Observer API mocks are properly loaded from the shared setupFiles.
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'training',
      include: [`${domainsDir}/training/**/*.{test,spec}.{ts,tsx}`],
      exclude: ['node_modules', 'dist', '.next', '**/node_modules/**'],
    },
  })
);
