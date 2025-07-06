/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json'
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(react-chessboard|chess.js|react-native|@react-native|@react-navigation|expo|@expo|react-native-.*)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/setup/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', 'jest.setup.ts', '<rootDir>/e2e/', '/e2e/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../shared/$1',
    '^@app/(.*)$': '<rootDir>/../app/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
    '^@app/web/(.*)$': '<rootDir>/../app/web/$1',
    '^@web/(.*)$': '<rootDir>/../app/web/$1',
    '^@app/mobile/(.*)$': '<rootDir>/../app/mobile/$1',
    'react-native$': 'react-native-web',
    '@react-native-async-storage/async-storage': '<rootDir>/shared/tests/mocks/async-storage.js',
    'expo-.*': '<rootDir>/shared/tests/mocks/expo.js',
    '@react-navigation/.*': '<rootDir>/shared/tests/mocks/react-navigation.js',
    'react-native-safe-area-context': '<rootDir>/shared/tests/mocks/safe-area-context.js'
  },
  testMatch: [
    '<rootDir>/unit/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/integration/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/performance/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/regression/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/smoke/**/*.{spec,test}.[jt]s?(x)'
  ],
  collectCoverageFrom: [
    '../shared/**/*.{ts,tsx}',
    '../app/web/**/*.{ts,tsx}',
    '../app/mobile/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
    '!**/tests/**',
    '!**/mocks/**'
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['lcov', 'text', 'html', 'json-summary']
}; 