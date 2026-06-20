module.exports = {
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/scripts/**",
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js", "<rootDir>/src/**/*.test.js"],
};
