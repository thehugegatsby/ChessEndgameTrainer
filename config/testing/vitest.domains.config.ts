import { defineConfig, mergeConfig } from 'vitest/config';
import { domainsDir } from '../paths';
import baseConfig from '../../vitest.base.config';

/**
 * Vitest Domains Project Configuration
 *
 * Merges the base configuration with domains-specific settings.
 * This handles domain-driven architecture test patterns.
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'domains',
      include: [`${domainsDir}/**/*.{test,spec}.{ts,tsx}`],
      exclude: ['node_modules', 'dist', '.next', '**/node_modules/**'],
    },
  })
);