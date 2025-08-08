module.exports = {
  testEnvironment: "jsdom",
  rootDir: ".",
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "@swc/jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/shared/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
