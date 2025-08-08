/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: "jsdom",

  // Test match patterns
  testMatch: ["<rootDir>/tests/**/*.(test|spec).(js|jsx|ts|tsx)"],

  // Module path mapping (align with Next.js)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/shared/$1",
    "^@shared/(.*)$": "<rootDir>/shared/$1",
    "^@pages/(.*)$": "<rootDir>/pages/$1",
    "^@public/(.*)$": "<rootDir>/public/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
    // Mock CSS modules
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    // Mock static assets
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/tests/mocks/fileMock.js",
  },

  // Setup files
  setupFilesAfterEnv: [
    "<rootDir>/configs/jest/jest.setup.js",
    "<rootDir>/tests/setup/mocks.setup.js",
  ],

  // Transform configuration
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "@swc/jest",
  },

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Coverage configuration
  collectCoverageFrom: [
    "shared/**/*.{ts,tsx}",
    "pages/**/*.{ts,tsx}",
    "!shared/**/*.d.ts",
    "!shared/**/__tests__/**",
    "!shared/**/node_modules/**",
    "!shared/**/*.stories.{ts,tsx}",
    "!shared/benchmarks/**",
    "!shared/tests/**",
  ],

  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],

  // Test timeout
  testTimeout: 30000,

  // Ignore patterns
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/shared/__tests__/", // Old test structure
    "<rootDir>/shared/tests/", // Old test structure
  ],

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Test projects for different test types
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.(test|spec).(js|jsx|ts|tsx)"],
      testEnvironment: "jsdom",
    },
    {
      displayName: "integration",
      testMatch: [
        "<rootDir>/tests/integration/**/*.(test|spec).(js|jsx|ts|tsx)",
      ],
      testEnvironment: "jsdom",
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/shared/$1",
        "^@shared/(.*)$": "<rootDir>/shared/$1",
        "^@pages/(.*)$": "<rootDir>/pages/$1",
        "^@public/(.*)$": "<rootDir>/public/$1",
        "^@tests/(.*)$": "<rootDir>/tests/$1",
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
          "<rootDir>/tests/mocks/fileMock.js",
      },
    },
    {
      displayName: "performance",
      testMatch: [
        "<rootDir>/tests/performance/**/*.(test|spec).(js|jsx|ts|tsx)",
      ],
      testEnvironment: "node",
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/shared/$1",
        "^@shared/(.*)$": "<rootDir>/shared/$1",
        "^@pages/(.*)$": "<rootDir>/pages/$1",
        "^@public/(.*)$": "<rootDir>/public/$1",
        "^@tests/(.*)$": "<rootDir>/tests/$1",
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
          "<rootDir>/tests/mocks/fileMock.js",
      },
    },
    {
      displayName: "regression",
      testMatch: [
        "<rootDir>/tests/regression/**/*.(test|spec).(js|jsx|ts|tsx)",
      ],
      testEnvironment: "jsdom",
    },
  ],
};

module.exports = config;
