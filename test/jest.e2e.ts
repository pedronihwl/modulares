const config = require('./jest.shared.ts');

module.exports = {
    ...config,
    testMatch: ['<rootDir>/src/__tests__/e2e/*.spec.ts']
};