/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': '@swc/jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(react-chessboard|chess.js|react-native|@react-native|@react-navigation|expo|@expo|react-native-.*)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/config/jest/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', 'jest.setup.ts', '/app/mobile/', '/tests/e2e/', '.*\\.skip\\..*'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/shared/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@app/web/(.*)$': '<rootDir>/app/web/$1',
    '^@web/(.*)$': '<rootDir>/app/web/$1',
    '^@app/mobile/(.*)$': '<rootDir>/app/mobile/$1',
    'react-native$': 'react-native-web',
    '@react-native-async-storage/async-storage': '<rootDir>/shared/tests/mocks/async-storage.js',
    'expo-.*': '<rootDir>/shared/tests/mocks/expo.js',
    '@react-navigation/.*': '<rootDir>/shared/tests/mocks/react-navigation.js',
    'react-native-safe-area-context': '<rootDir>/shared/tests/mocks/safe-area-context.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testMatch: [
    '<rootDir>/shared/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/shared/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/tests/**/*.{spec,test}.[jt]s?(x)',
    '!<rootDir>/tests/e2e/**',
    '<rootDir>/app/web/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/app/web/**/*.{spec,test}.[jt]s?(x)',
    '<rootDir>/app/mobile/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/app/mobile/**/*.{spec,test}.[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'shared/**/*.{ts,tsx}',
    'app/web/**/*.{ts,tsx}',
    'app/mobile/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ]
}; 