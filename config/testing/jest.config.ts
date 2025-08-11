import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
// @ts-ignore - importing JSON
import tsconfig from '../../tsconfig.json';
import { 
  projectRoot, 
  testSetupFile, 
  integrationSetupFile,
  fileMock,
  coverageDir,
  jestCacheDir,
  unitTestsDir,
  integrationTestsDir
} from '../paths';

/**
 * Consolidated Jest Configuration
 * Uses Jest Projects API to manage different test types
 */

// Base configuration shared by all projects
const baseConfig = {
  // Use SWC for faster transpilation with TypeScript support
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: false,
          importAttributes: true,
          dynamicImport: true,
        },
        target: 'es2018',
        loose: false,
        externalHelpers: false,
        keepClassNames: true,
        transform: {
          react: {
            pragma: 'React.createElement',
            pragmaFrag: 'React.Fragment',
            throwIfNamespace: true,
            development: true,
            useBuiltins: false,
            runtime: 'automatic'
          }
        }
      },
      module: {
        type: 'commonjs',
        strict: true,
        noInterop: false
      }
    }]
  },
  
  // Transform these node_modules that use ES modules
  transformIgnorePatterns: [
    '/node_modules/(?!(nanoid|supermemo|react-chessboard|chess.js|react-hotkeys-hook|react-chess-pieces|react-native|@react-native|@react-navigation|expo|@expo|react-native-.*)/)'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Path mapping from tsconfig
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths || {}, { prefix: '<rootDir>/' }),
    // Mock static assets
    '\\.(svg)$': fileMock,
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    'react-chess-pieces/dist/.*\\.svg$': fileMock
  },
  
  // Base setup files
  setupFilesAfterEnv: [testSetupFile],
  
  // Test environment defaults
  clearMocks: true,
  restoreMocks: true,
  
  // Performance optimizations
  cache: true,
  cacheDirectory: jestCacheDir,
};

const config: Config = {
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
      rootDir: projectRoot,
      testEnvironment: 'jsdom',
      testMatch: [
        `${unitTestsDir}/**/*.test.[jt]s?(x)`,
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
      rootDir: projectRoot,
      testEnvironment: 'jsdom',
      testMatch: [
        `${integrationTestsDir}/**/*.test.[jt]s?(x)`,
      ],
      setupFilesAfterEnv: [
        testSetupFile,
        integrationSetupFile, // Additional setup for integration tests
      ],
      testTimeout: 30000, // Longer timeout for integration tests
    },
    {
      ...baseConfig,
      displayName: 'services',
      rootDir: projectRoot,
      testEnvironment: 'node', // Services run in Node environment
      testMatch: [
        `${unitTestsDir}/services/**/*.test.[jt]s`,
      ],
    },
    {
      ...baseConfig,
      displayName: 'store',
      rootDir: projectRoot,
      testEnvironment: 'node', // Zustand doesn't need DOM
      testMatch: [
        `${unitTestsDir}/store/**/*.test.[jt]s`,
      ],
    },
    {
      ...baseConfig,
      displayName: 'firebase',
      rootDir: projectRoot,
      testEnvironment: 'node',
      testMatch: [
        `${integrationTestsDir}/firebase/**/*.test.[jt]s?(x)`,
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
  coverageDirectory: coverageDir,
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
};

export default config;