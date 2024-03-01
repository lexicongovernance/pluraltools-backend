/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  testPathIgnorePatterns: ['node_modules'],
  preset: 'ts-jest',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverage: false,
  collectCoverageFrom: [
    'src/modules/**/*.ts',
    'src/services/**/*.ts',
  ],
};
