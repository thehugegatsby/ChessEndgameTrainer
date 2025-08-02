/** @type {import('jest').Config} */
const path = require("path");
const baseConfig = require("../jest.config.js");

module.exports = {
  ...baseConfig,
  // Set root directory to project root, not tests folder
  rootDir: path.resolve(__dirname, ".."),
  // Use jest-fixed-jsdom for MSW v2 compatibility with React Testing Library
  testEnvironment: "jest-fixed-jsdom",
  // Specific config for integration tests
  displayName: "Integration Tests",
  // Only match .spec files for integration tests
  testMatch: ["<rootDir>/tests/integration/**/*.spec.[jt]s?(x)"],
  setupFilesAfterEnv: [
    "<rootDir>/config/jest/jest.setup.js",
    "<rootDir>/tests/integration/setup.ts",
  ],
  testTimeout: 10000, // Increase timeout for integration tests
};
