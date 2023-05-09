module.exports = {
  ignorePatterns: ['dist/**/*', 'build/**/*'],
  extends: ['standard', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: '2020'
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'import/order': 'error',
    'no-use-before-define': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'n/no-callback-literal': 'off',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-use-before-define': 'error',
    'prettier/prettier': [
      'error',
      {
        tabWidth: 2,
        printWidth: 120,
        singleQuote: true,
        trailingComma: 'none',
        semi: false
      }
    ]
  }
}
