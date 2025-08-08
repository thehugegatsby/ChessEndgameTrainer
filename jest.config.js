/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': '@swc/jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(nanoid|supermemo|react-chessboard|chess.js|react-native|@react-native|@react-navigation|expo|@expo|react-native-.*)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/utils/jestSetup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/.next/', 
    '/playwright-report/',
    '/test-results/',
    'jest.setup.ts',
    '/tests/e2e/'  // Exclude Playwright tests
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  },
  testMatch: [
    '<rootDir>/src/tests/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/tests/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/src/shared/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/shared/**/*.{spec,test}.[jt]s?(x)',
    '!<rootDir>/src/tests/e2e/**/*'  // Exclude E2E tests
  ],
  collectCoverageFrom: [
    'src/shared/**/*.{ts,tsx}',
    'src/app/**/*.{ts,tsx}',
    'src/pages/**/*.{ts,tsx}',
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
  silent: true, // Disable console output for faster tests
  
  // Performance optimizations
  maxWorkers: 'max', // Use all available CPU cores
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Fail fast in CI
  bail: process.env.CI ? 1 : 0
};