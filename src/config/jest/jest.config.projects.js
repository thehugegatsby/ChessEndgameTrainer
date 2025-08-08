/** @type {import('jest').Config} */
/**
 * Jest Projects Configuration
 * Separates React tests (jsdom) from Node tests for optimal performance
 */

const path = require('path');

// Calculate the absolute path to the project root
const projectRoot = path.resolve(__dirname, '../../../');

const baseConfig = {
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': '@swc/jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(nanoid|supermemo|react-chessboard|chess.js|react-native|@react-native|@react-navigation|expo|@expo|react-native.*)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/utils/jestSetup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/playwright-report/',
    '/test-results/',
    'jest.setup.ts',
    '/tests/e2e/'
  ],
  collectCoverageFrom: [
    'src/shared/**/*.{ts,tsx}',
    'src/app/**/*.{ts,tsx}',
    'src/pages/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!src/shared/constants/**',
    '!src/shared/types/**'
  ],
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules',
    '<rootDir>/dist',
    '<rootDir>/.next',
    '<rootDir>/.cache',
    '<rootDir>/coverage'
  ]
};

module.exports = {
  // Global settings that apply to all projects
  rootDir: projectRoot,
  roots: ['<rootDir>/src/shared', '<rootDir>/src/tests', '<rootDir>/src/pages', '<rootDir>/src/app'], // Explicit roots to prevent unnecessary scanning
  maxWorkers: 4, // Use fixed 4 workers for consistent performance
  forceExit: true, // Force Jest to exit after tests complete
  projects: [
    {
      ...baseConfig,
      rootDir: projectRoot,
      displayName: 'react',
      testEnvironment: 'jsdom',
      testMatch: [
        // React component tests
        '<rootDir>/src/tests/**/components/**/*.{test,spec}.[jt]s?(x)',
        '<rootDir>/src/tests/**/ui/**/*.{test,spec}.[jt]s?(x)',
        '<rootDir>/src/tests/**/pages/**/*.{test,spec}.[jt]s?(x)',
        '<rootDir>/src/tests/**/app/**/*.{test,spec}.[jt]s?(x)',
        // React hooks that use DOM
        '<rootDir>/src/tests/**/hooks/**/*.{test,spec}.[jt]s?(x)',
        // Integration tests often need DOM
        '<rootDir>/src/tests/integration/**/*.{test,spec}.[jt]s?(x)',
        // Platform service needs DOM
        '<rootDir>/src/tests/unit/services/platform/WebPlatformService.test.ts'
      ]
    },
    {
      ...baseConfig,
      rootDir: projectRoot,
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        // Service tests (except WebPlatformService which needs DOM)
        '<rootDir>/src/tests/**/services/**/!(WebPlatformService).{test,spec}.[jt]s',
        '<rootDir>/src/tests/unit/services/**/!(WebPlatformService).{test,spec}.[jt]s',
        // Store tests (Zustand doesn't need DOM)
        '<rootDir>/src/tests/unit/store/**/*.{test,spec}.[jt]s',
        // Pure logic tests
        '<rootDir>/src/tests/unit/chess/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/unit/utils/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/unit/types/**/*.{test,spec}.[jt]s',
        // Other non-React tests
        '<rootDir>/src/tests/smoke/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/validation/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/examples/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/unit/*.{test,spec}.[jt]s'
      ],
      testPathIgnorePatterns: [
        ...baseConfig.testPathIgnorePatterns,
        // Exclude WebPlatformService from node tests  
        '.*/WebPlatformService\\.test\\.ts$'
      ]
    }
  ],
  // Global performance optimizations
  maxWorkers: 'max'
};