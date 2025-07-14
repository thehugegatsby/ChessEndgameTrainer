// Feature-specific Jest configuration for accurate coverage
const nextJest = require('next/jest');

// Create the base Next.js Jest configuration
const createJestConfig = nextJest({
  dir: './',
});

// Custom configuration for feature coverage
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  rootDir: '.',
  
  // Specific coverage collection for evaluation features
  collectCoverageFrom: [
    'shared/utils/chess/evaluationHelpers.ts',
    'shared/utils/chess/evaluationHelpers.tsx',
    'shared/services/chess/EngineService.ts',
    'shared/lib/chess/ScenarioEngine/evaluationService.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  
  // Test patterns for evaluation features
  testMatch: [
    '<rootDir>/tests/unit/chess/*evaluation*.test.ts',
    '<rootDir>/tests/unit/chess/*Evaluation*.test.ts',
    '<rootDir>/tests/unit/engine/*valuation*.test.ts',
  ],
  
  coverageThreshold: {
    'shared/utils/chess/evaluationHelpers.ts': {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85,
    },
  },
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/shared/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
};

module.exports = createJestConfig(customJestConfig);