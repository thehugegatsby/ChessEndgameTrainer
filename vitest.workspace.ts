import { defineWorkspace } from 'vitest/config';
import { featuresDir, sharedDir, testsDir } from './config/paths';

/**
 * Vitest Workspace Configuration
 * Defines separate projects for feature-based testing
 */
export default defineWorkspace([
  {
    extends: './config/testing/vitest.unit.config.ts',
    test: {
      name: 'chess-core',
      include: [`${featuresDir}/chess-core/**/*.{test,spec}.{ts,tsx}`],
    },
  },
  {
    extends: './config/testing/vitest.unit.config.ts',
    test: {
      name: 'tablebase',
      include: [`${featuresDir}/tablebase/**/*.{test,spec}.{ts,tsx}`],
    },
  },
  {
    extends: './config/testing/vitest.unit.config.ts',
    test: {
      name: 'training',
      include: [`${featuresDir}/training/**/*.{test,spec}.{ts,tsx}`],
    },
  },
  {
    extends: './config/testing/vitest.unit.config.ts',
    test: {
      name: 'move-quality',
      include: [`${featuresDir}/move-quality/**/*.{test,spec}.{ts,tsx}`],
    },
  },
  {
    extends: './config/testing/vitest.unit.config.ts',
    test: {
      name: 'shared',
      include: [`${sharedDir}/**/*.{test,spec}.{ts,tsx}`],
    },
  },
  {
    extends: './config/testing/vitest.integration.config.ts',
    test: {
      name: 'integration',
      include: [`${testsDir}/integration/**/*.{test,spec}.{ts,tsx}`],
    },
  },
]);