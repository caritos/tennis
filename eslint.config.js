// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // Catch undefined variables
      'no-undef': 'error',
      // Catch unused variables (with common exceptions)
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true 
      }],
      // Ensure all variables are declared (but allow function hoisting and styles)
      'no-use-before-define': ['error', { 
        functions: false, 
        classes: true, 
        variables: false, // Allow styles to be used before defined
        allowNamedExports: false
      }],
    }
  }
]);