import { defineWorkspace } from 'vitest/config';

/**
 * Vitest Workspace Configuration
 * 
 * Enables project-based testing with clear separation:
 * - Each feature has its own test project
 * - Consistent naming and configuration
 * - Optimized for WSL2 performance
 */
export default defineWorkspace([
  // Domain Projects (Unit Tests)
  {
    extends: './config/testing/vitest.chess-core.config.ts',
    test: {
      name: 'game',
      include: ['src/domains/game/**/*.{test,spec}.{ts,tsx}'],
    },
  },
  {
    extends: './config/testing/vitest.tablebase.config.ts', 
    test: {
      name: 'evaluation',
      include: ['src/domains/evaluation/**/*.{test,spec}.{ts,tsx}'],
    },
  },
  {
    extends: './config/testing/vitest.training.config.ts',
    test: {
      name: 'training', 
      include: ['src/domains/training/**/*.{test,spec}.{ts,tsx}'],
    },
  },
  {
    extends: './config/testing/vitest.shared.config.ts',
    test: {
      name: 'shared',
      include: ['src/shared/**/*.{test,spec}.{ts,tsx}'],
    },
  },
  
  // Integration Tests (Separate Project)
  {
    extends: './config/testing/vitest.integration.config.ts',
    test: {
      name: 'integration',
      include: [
        'src/tests/integration/**/*.{test,spec}.{ts,tsx}',
        'src/domains/**/integration/**/*.{test,spec}.{ts,tsx}',
      ],
    },
  },
]);