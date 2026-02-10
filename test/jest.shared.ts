module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@identityModule/(.*)$': '<rootDir>/src/module/identity/$1',
    '^@contentModule/(.*)$': '<rootDir>/src/module/content/$1',
    '^@sharedModule/(.*)$': '<rootDir>/src/module/shared/module/$1',
    '^@sharedLib/(.*)$': '<rootDir>/src/module/shared/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@database/(.*)$': '<rootDir>/database/$1',
    '^@testInfra/(.*)$': '<rootDir>/test/$1',
  },
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/test/setup.ts'],
  verbose: true,
  resetMocks: true,
};
