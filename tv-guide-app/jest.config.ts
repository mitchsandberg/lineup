import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/global\\.css$': '<rootDir>/src/__mocks__/style-mock.ts',
    '\\.(css|less|scss)$': '<rootDir>/src/__mocks__/style-mock.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native$': '<rootDir>/src/__mocks__/react-native.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  globals: {
    __DEV__: true,
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.web.ts',
    '!src/__tests__/**',
    '!src/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 94,
      functions: 100,
      lines: 99,
      statements: 99,
    },
  },
};

export default config;
