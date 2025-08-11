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
    '/node_modules/(?!(nanoid|supermemo|react-chessboard|chess.js|react-hotkeys-hook|react-native|@react-native|@react-navigation|expo|@expo|react-native.*)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
    '<rootDir>/src/tests/utils/jestSetup.ts',
    '<rootDir>/src/tests/setup/global-test-cleanup.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1',
    '\\.(svg|png|jpg|jpeg|gif)$': 'jest-transform-stub'
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
  forceExit: true, // Force Jest to exit after tests complete
  projects: [
    {
      ...baseConfig,
      rootDir: projectRoot,
      displayName: 'react',
      testEnvironment: 'jsdom',
      testMatch: [
        // Unit tests for React hooks that use DOM
        '<rootDir>/src/tests/unit/hooks/**/*.{test,spec}.[jt]s?(x)',
        // Unit tests for React components that use DOM
        '<rootDir>/src/tests/unit/components/**/*.{test,spec}.[jt]s?(x)',
        // Integration tests often need DOM (but NOT firebase ones)
        '<rootDir>/src/tests/integration/**/*.{test,spec}.[jt]s?(x)',
        // Platform service needs DOM
        '<rootDir>/src/tests/unit/services/platform/WebPlatformService.test.ts'
      ],
      // Firebase-Tests explizit aus diesem Projekt ausschließen
      testPathIgnorePatterns: [
        ...baseConfig.testPathIgnorePatterns,
        '<rootDir>/src/tests/integration/firebase/'
      ]
    },
    {
      ...baseConfig,
      rootDir: projectRoot,
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        // Direct service tests (except WebPlatformService which needs DOM)
        '<rootDir>/src/tests/services/**/!(WebPlatformService).{test,spec}.[jt]s',
        '<rootDir>/src/tests/unit/services/**/!(WebPlatformService).{test,spec}.[jt]s',
        // Store tests (Zustand doesn't need DOM)
        '<rootDir>/src/tests/unit/store/**/*.{test,spec}.[jt]s',
        // Pure logic tests
        '<rootDir>/src/tests/unit/chess/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/unit/utils/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/unit/types/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/unit/lib/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/unit/infrastructure/**/*.{test,spec}.[jt]s',
        // Orchestrator tests (move quality, validation, etc.)
        '<rootDir>/src/tests/unit/orchestrators/**/*.{test,spec}.[jt]s',
        // Other non-React tests
        '<rootDir>/src/tests/smoke/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/validation/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/examples/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/performance/**/*.{test,spec}.[jt]s',
        '<rootDir>/src/tests/unit/*.{test,spec}.[jt]s'
      ],
      testPathIgnorePatterns: [
        ...baseConfig.testPathIgnorePatterns,
        // Exclude WebPlatformService from node tests  
        '.*/WebPlatformService\\.test\\.ts$'
      ]
    },
    // Dediziertes Projekt für Firebase-Integrationstests
    {
      ...baseConfig,
      rootDir: projectRoot,
      displayName: 'firebase',
      testEnvironment: 'node', // Firebase-Tests laufen in Node
      testMatch: [
        '<rootDir>/src/tests/integration/firebase/**/*.{test,spec}.[jt]s?(x)'
      ],
      // Override base timeout for long-running emulator tests
      testTimeout: 60000
    }
  ]
};