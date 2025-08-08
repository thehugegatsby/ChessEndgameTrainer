/** @type {import('jest').Config} */
/**
 * Jest Projects Configuration
 * Separates React tests (jsdom) from Node tests for optimal performance
 */

const path = require('path');

// Calculate the absolute path to the project root
const projectRoot = path.resolve(__dirname, '../../');

const baseConfig = {
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: false,
          dynamicImport: true
        },
        transform: {
          react: {
            runtime: 'automatic',
            development: false,
            refresh: false
          }
        },
        target: 'es2020'
      },
      module: {
        type: 'commonjs'
      }
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(nanoid|supermemo|react-chessboard|chess.js|react-native|@react-native|@react-navigation|expo|@expo|react-native.*)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/utils/jestSetup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@pages/(.*)$': '<rootDir>/pages/$1'
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
    'shared/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!shared/constants/**',
    '!shared/types/**'
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
  roots: ['<rootDir>/shared', '<rootDir>/tests', '<rootDir>/pages', '<rootDir>/app'], // Explicit roots to prevent unnecessary scanning
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
        '<rootDir>/tests/**/components/**/*.{test,spec}.[jt]s?(x)',
        '<rootDir>/tests/**/ui/**/*.{test,spec}.[jt]s?(x)',
        '<rootDir>/tests/**/pages/**/*.{test,spec}.[jt]s?(x)',
        '<rootDir>/tests/**/app/**/*.{test,spec}.[jt]s?(x)',
        // React hooks that use DOM
        '<rootDir>/tests/**/hooks/**/*.{test,spec}.[jt]s?(x)',
        // Integration tests often need DOM
        '<rootDir>/tests/integration/**/*.{test,spec}.[jt]s?(x)',
        // Platform service needs DOM
        '<rootDir>/tests/unit/services/platform/WebPlatformService.test.ts'
      ]
    },
    {
      ...baseConfig,
      rootDir: projectRoot,
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        // Service tests (except WebPlatformService)
        '<rootDir>/tests/services/**/*.{test,spec}.[jt]s',
        '<rootDir>/tests/unit/services/**/*.{test,spec}.[jt]s',
        // Store tests (Zustand doesn't need DOM)
        '<rootDir>/tests/unit/store/**/*.{test,spec}.[jt]s',
        // Pure logic tests
        '<rootDir>/tests/unit/chess/**/*.{test,spec}.[jt]s',
        '<rootDir>/tests/unit/utils/**/*.{test,spec}.[jt]s',
        '<rootDir>/tests/unit/types/**/*.{test,spec}.[jt]s',
        // Other non-React tests
        '<rootDir>/tests/smoke/**/*.{test,spec}.[jt]s',
        '<rootDir>/tests/validation/**/*.{test,spec}.[jt]s',
        '<rootDir>/tests/examples/**/*.{test,spec}.[jt]s',
        '<rootDir>/tests/unit/promotion-detection.test.ts'
      ],
      testPathIgnorePatterns: [
        ...baseConfig.testPathIgnorePatterns,
        // Exclude WebPlatformService from node tests
        'WebPlatformService.test.ts'
      ]
    }
  ],
  // Global performance optimizations
  maxWorkers: 'max'
};