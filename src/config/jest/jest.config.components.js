/**
 * Jest Configuration for E2E Component Tests
 * Tests Page Object Models (BoardComponent, TestBridgeWrapper, etc.) in isolation
 */

module.exports = {
  displayName: "E2E Component Tests",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests/components"],
  testMatch: ["**/__tests__/**/*.test.ts"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    // Mock Playwright for isolated testing of Page Object Models
    "^@playwright/test$": "<rootDir>/tests/components/__mocks__/playwright.ts",
    // Mock BaseComponent - UPDATED to catch relative imports
    "(.*)/BaseComponent$":
      "<rootDir>/tests/e2e/components/__mocks__/BaseComponent.ts",
    "../../../shared/services/logging":
      "<rootDir>/tests/components/__mocks__/logging.ts",
    "../config/constants": "<rootDir>/tests/components/__mocks__/constants.ts",
    "../builders/types": "<rootDir>/tests/components/__mocks__/types.ts",
  },

  transform: {
    "^.+\\.tsx?$": "@swc/jest",
  },

  setupFilesAfterEnv: ["<rootDir>/tests/components/setup.ts"],

  coverageDirectory: "coverage/e2e-components",
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage for E2E Page Object Models (not app source code)
  collectCoverageFrom: [
    "tests/e2e/components/**/*.ts",
    "!tests/e2e/components/**/*.d.ts",
    "!tests/e2e/components/**/index.ts",
    "!tests/e2e/components/**/types.ts",
    "!tests/e2e/components/**/I*.ts", // Exclude interfaces
  ],

  // Test utilities
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,

  // Alternative: Multi-project setup (as suggested by o3-mini)
  // Can be considered for future scaling
};
