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
    '/node_modules/(?!react-chessboard|chess.js)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@app/web/(.*)$': '<rootDir>/app/web/$1',
    '^@web/(.*)$': '<rootDir>/app/web/$1',
    '^@app/mobile/(.*)$': '<rootDir>/app/mobile/$1'
  },
  testMatch: [
    '<rootDir>/shared/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/shared/**/*.{spec,test}.[jt]s?(x)',
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