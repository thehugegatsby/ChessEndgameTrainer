/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
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
    '/node_modules/(?!(nanoid|supermemo|react-chessboard|chess.js|react-native|@react-native|@react-navigation|expo|@expo|react-native-.*)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/utils/jestSetup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/.next/', 
    '/playwright-report/',
    '/test-results/',
    'jest.setup.ts',
    '/tests/e2e/'  // Exclude Playwright tests
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@pages/(.*)$': '<rootDir>/pages/$1'
  },
  testMatch: [
    '<rootDir>/tests/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/tests/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/shared/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/shared/**/*.{spec,test}.[jt]s?(x)',
    '!<rootDir>/tests/e2e/**/*'  // Exclude E2E tests
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
  // Global setup
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: false,
  
  // Performance optimizations
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Fail fast in CI
  bail: process.env.CI ? 1 : 0
};