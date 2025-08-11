/** @type {import('jest').Config} */
/**
 * Jest configuration for business logic coverage only
 * This configuration excludes UI components, pages, and mobile app from coverage
 * to get accurate metrics for the core business logic
 */
module.exports = {
  testEnvironment: "jsdom",
  rootDir: "../..",
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "@swc/jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(react-chessboard|chess.js|react-native|@react-native|@react-navigation|expo|@expo|react-native-.*)/)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/config/testing/jest.setup.ts"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "jest.setup.ts",
    "<rootDir>/e2e/",
    "/e2e/",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@app/(.*)$": "<rootDir>/src/app/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@app/web/(.*)$": "<rootDir>/src/app/web/$1",
    "^@web/(.*)$": "<rootDir>/src/app/web/$1",
    "^@app/mobile/(.*)$": "<rootDir>/src/app/mobile/$1",
    "react-native$": "react-native-web",
    "@react-native-async-storage/async-storage":
      "<rootDir>/src/tests/shared/tests/mocks/async-storage.js",
    "expo-.*": "<rootDir>/src/tests/shared/tests/mocks/expo.js",
    "@react-navigation/.*":
      "<rootDir>/src/tests/shared/tests/mocks/react-navigation.js",
    "react-native-safe-area-context":
      "<rootDir>/src/tests/shared/tests/mocks/safe-area-context.js",
  },
  testMatch: [
    "<rootDir>/src/tests/unit/**/*.{spec,test}.[jt]s?(x)",
    "<rootDir>/src/tests/integration/**/*.{spec,test}.[jt]s?(x)",
    "<rootDir>/src/tests/performance/**/*.{spec,test}.[jt]s?(x)",
    "<rootDir>/src/tests/regression/**/*.{spec,test}.[jt]s?(x)",
    "<rootDir>/src/tests/smoke/**/*.{spec,test}.[jt]s?(x)",
    "<rootDir>/src/tests/**/*.test.[jt]s?(x)",
  ],
  // BUSINESS LOGIC COVERAGE ONLY
  collectCoverageFrom: [
    // Include all business logic modules
    "<rootDir>/src/shared/lib/**/*.{ts,tsx}",
    "<rootDir>/src/shared/services/**/*.{ts,tsx}",
    "<rootDir>/src/shared/hooks/**/*.{ts,tsx}",
    "<rootDir>/src/shared/store/**/*.{ts,tsx}",
    "<rootDir>/src/shared/contexts/**/*.{ts,tsx}",
    "<rootDir>/src/shared/utils/**/*.{ts,tsx}",

    // Exclude non-business logic
    "!<rootDir>/shared/components/**", // UI Components
    "!<rootDir>/shared/benchmarks/**", // Performance benchmarks
    "!<rootDir>/shared/constants/**", // Constants (usually 100% or not testable)
    "!<rootDir>/shared/data/**", // Static data files

    // Exclude all app and pages
    "!<rootDir>/app/**",
    "!<rootDir>/pages/**",

    // Exclude common patterns
    "!**/*.d.ts", // Type definitions
    "!**/node_modules/**", // Dependencies
    "!**/*.test.{ts,tsx,js,jsx}", // Test files
    "!**/*.spec.{ts,tsx,js,jsx}", // Spec files
    "!**/tests/**", // Test directories
    "!**/mocks/**", // Mock files
    "!**/.next/**", // Next.js build
    "!**/coverage/**", // Coverage reports
    "!**/index.ts", // Index files (usually re-exports)
    "!**/types.ts", // Type-only files
  ],
  coverageDirectory: "<rootDir>/coverage-business",
  coverageReporters: ["lcov", "text", "html", "json-summary"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/tests/",
    "/.next/",
    "/coverage/",
  ],
  // Coverage thresholds for business logic
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};
