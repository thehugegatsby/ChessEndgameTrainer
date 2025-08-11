/** @type {import('jest').Config} */

// Import the main Jest config and customize for integration tests  
const baseConfig = require('./jest.config.ts').default;

module.exports = {
  ...baseConfig,
  // Override projects to only run integration tests
  projects: baseConfig.projects.filter(project => 
    project.displayName === 'integration'
  ).map(project => ({
    ...project,
    // Use jest-fixed-jsdom for MSW v2 compatibility
    testEnvironment: "jest-fixed-jsdom", 
    // Override to match .spec files specifically
    testMatch: [`${project.testMatch[0].replace('*.test.', '*.spec.')}`],
    testTimeout: 10000,
  })),
};
