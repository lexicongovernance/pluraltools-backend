/* eslint-env node */
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:drizzle/all',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'drizzle'],
  root: true,
  ignorePatterns: ['dist', '.eslintrc.cjs', 'drizzle.config.js', 'jest.config.js'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_ignored', ignoreRestSiblings: true },
    ],
  },
};
