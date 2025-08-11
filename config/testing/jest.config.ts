import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
// @ts-ignore - importing JSON
import tsconfig from '../../tsconfig.json';

/**
 * Consolidated Jest Configuration
 * Uses Jest Projects API to manage different test types
 */

// Base configuration shared by all projects
const baseConfig = {
  // Use SWC for faster transpilation
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': '@swc/jest'
  },
  
  // Transform these node_modules that use ES modules
  transformIgnorePatterns: [
    '/node_modules/(?!(nanoid|supermemo|react-chessboard|chess.js|react-hotkeys-hook|react-chess-pieces|react-native|@react-native|@react-navigation|expo|@expo|react-native-.*)/)'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Path mapping from tsconfig
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths || {}, { prefix: '<rootDir>/../../' }),
    // Mock static assets
    '\\.(svg)$': '<rootDir>/../../src/tests/__mocks__/fileMock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    'react-chess-pieces/dist/.*\\.svg$': '<rootDir>/../../src/tests/__mocks__/fileMock.js'
  },
  
  // Base setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Test environment defaults
  clearMocks: true,
  restoreMocks: true,
  
  // Performance optimizations
  cache: true,
  cacheDirectory: '<rootDir>/../../.jest-cache',
};

const config: Config = {
  // Root directory for all projects
  rootDir: '.',
  
  // Global settings
  verbose: false,
  silent: process.env['CI'] === 'true',
  maxWorkers: process.env['CI'] ? 4 : 'max',
  testTimeout: 10000,
  bail: process.env['CI'] ? 1 : 0,
  
  // Define projects for different test types
  projects: [
    {
      ...baseConfig,
      displayName: 'unit',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/../../src/**/*.unit.test.[jt]s?(x)',
        '<rootDir>/../../src/tests/unit/**/*.test.[jt]s?(x)',
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/.next/',
        '/e2e/',
        '\\.spec\\.ts$'
      ],
    },
    {
      ...baseConfig,
      displayName: 'integration',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/../../src/**/*.int.test.[jt]s?(x)',
        '<rootDir>/../../src/tests/integration/**/*.test.[jt]s?(x)',
      ],
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.ts',
        '<rootDir>/jest.setup.integration.ts', // Additional setup for integration tests
      ],
      testTimeout: 30000, // Longer timeout for integration tests
    },
    {
      ...baseConfig,
      displayName: 'services',
      testEnvironment: 'node', // Services run in Node environment
      testMatch: [
        '<rootDir>/../../src/tests/unit/services/**/*.test.[jt]s',
        '<rootDir>/../../src/tests/services/**/*.test.[jt]s',
      ],
    },
    {
      ...baseConfig,
      displayName: 'store',
      testEnvironment: 'node', // Zustand doesn't need DOM
      testMatch: [
        '<rootDir>/../../src/tests/unit/store/**/*.test.[jt]s',
      ],
    },
    {
      ...baseConfig,
      displayName: 'firebase',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/../../src/tests/integration/firebase/**/*.test.[jt]s?(x)',
      ],
      testTimeout: 60000, // Firebase emulator tests need more time
    },
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/shared/**/*.{ts,tsx}',
    'src/app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!src/shared/constants/**',
    '!src/shared/types/**',
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
  ],
  coverageDirectory: '<rootDir>/../../coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
};

export default config;