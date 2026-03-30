module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['./tests/helpers/setup.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
};
