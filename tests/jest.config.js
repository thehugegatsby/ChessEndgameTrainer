/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '..',
  
  // Mock management for optimal test isolation
  clearMocks: true, // Change from resetMocks to clearMocks to avoid Jest internal conflicts 
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/configs/typescript/tsconfig.jest.json'
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(react-chessboard|chess.js|nanoid|react-native|@react-native|@react-navigation|expo|@expo|react-native-.*)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', 'jest.setup.ts', '<rootDir>/e2e/', '/e2e/', '<rootDir>/tests/_quarantined_e2e/', '/tests/_quarantined_e2e/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/shared/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@app/web/(.*)$': '<rootDir>/app/web/$1',
    '^@web/(.*)$': '<rootDir>/app/web/$1',
    '^@app/mobile/(.*)$': '<rootDir>/app/mobile/$1',
    'react-native$': 'react-native-web',
    '@react-native-async-storage/async-storage': '<rootDir>/tests/shared/tests/mocks/async-storage.js',
    'expo-.*': '<rootDir>/tests/shared/tests/mocks/expo.js',
    '@react-navigation/.*': '<rootDir>/tests/shared/tests/mocks/react-navigation.js',
    'react-native-safe-area-context': '<rootDir>/tests/shared/tests/mocks/safe-area-context.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js'
  },
  testMatch: [
    '<rootDir>/tests/unit/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/tests/integration/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/tests/performance/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/tests/regression/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/tests/smoke/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/tests/components/**/*.{spec,test}.[jt]s?(x)'  // Components tests (excluding quarantined)
  ],
  collectCoverageFrom: [
    '<rootDir>/shared/**/*.{ts,tsx,js,jsx}',
    '<rootDir>/app/web/**/*.{ts,tsx,js,jsx}',
    '<rootDir>/app/mobile/**/*.{ts,tsx,js,jsx}',
    '<rootDir>/pages/**/*.{ts,tsx,js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.test.{ts,tsx,js,jsx}',
    '!**/*.spec.{ts,tsx,js,jsx}',
    '!**/tests/**',
    '!**/mocks/**',
    '!**/.next/**',
    '!**/coverage/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['lcov', 'text', 'html', 'json-summary'],
  reporters: [
    'default',
    ['<rootDir>/tests/reporters/skippedTestsReporter.js', { maxSkippedTests: 12 }]
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/.next/',
    '/coverage/'
  ]
}; 