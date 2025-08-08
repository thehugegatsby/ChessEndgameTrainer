/** @type {import('jest').Config} */
// Configuration for non-React tests that don't need jsdom
module.exports = {
  ...require('./jest.config.js'),
  testEnvironment: 'node',
  testMatch: [
    // Service tests (exclude WebPlatformService which needs DOM)
    '<rootDir>/tests/services/**/*.{test,spec}.[jt]s',
    '<rootDir>/tests/unit/services/**/*.{test,spec}.[jt]s',
    '!<rootDir>/tests/unit/services/platform/WebPlatformService.test.ts',
    // Store tests (Zustand doesn't need DOM)
    '<rootDir>/tests/unit/store/**/*.{test,spec}.[jt]s',
    // Utility tests
    '<rootDir>/tests/unit/utils/**/*.{test,spec}.[jt]s',
    '<rootDir>/tests/unit/chess/**/*.{test,spec}.[jt]s',
    '<rootDir>/tests/unit/types/**/*.{test,spec}.[jt]s',
    // Other non-React tests
    '<rootDir>/tests/smoke/**/*.{test,spec}.[jt]s',
    '<rootDir>/tests/validation/**/*.{test,spec}.[jt]s',
    '<rootDir>/tests/examples/**/*.{test,spec}.[jt]s',
    '<rootDir>/tests/unit/promotion-detection.test.ts'
  ]
};