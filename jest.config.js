export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  // Floors on the core modules so coverage can't silently regress. Values are set
  // a few points below the current measured coverage to allow normal churn while
  // still catching real drops. Run `npm run test:coverage` to update these.
  // Note: only the listed paths/globs are enforced (no `global` key), so adding new
  // untested peripheral files won't fail the build, but the hot paths stay protected.
  coverageThreshold: {
    // Core API client request/response path
    './src/api/client/base-client.ts': {
      statements: 40,
      branches: 45,
      functions: 50,
      lines: 40,
    },
    // Tool dispatch + handlers. A directory-path key aggregates across all handler
    // files (a glob would instead enforce the floor on each file individually).
    './src/api/handlers/': {
      statements: 75,
      branches: 63,
      functions: 66,
      lines: 75,
    },
    // CLI / server configuration parsing + validation
    './src/utils/core/cli-config.ts': {
      statements: 95,
      branches: 80,
      functions: 95,
      lines: 95,
    },
    // Auth + rate-limiting utilities
    './src/utils/core/jwt-validator.ts': {
      statements: 90,
      branches: 72,
      functions: 90,
      lines: 90,
    },
    './src/utils/core/scope-manager.ts': {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
    },
    './src/utils/core/rate-limiter.ts': {
      statements: 88,
      branches: 85,
      functions: 88,
      lines: 88,
    },
    './src/utils/core/user-rate-limiter.ts': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageProvider: 'v8',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 10000,
};

