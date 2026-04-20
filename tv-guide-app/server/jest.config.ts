import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!__tests__/**',
    '!jest.config.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 97,
      functions: 94,
      lines: 99,
      statements: 98,
    },
  },
};

export default config;
