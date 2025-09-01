/**
 * Custom ESLint Rules for React Hook Dependencies
 * Prevents circular dependencies and stale closures
 */

module.exports = {
  extends: ['./.eslintrc.js'],
  rules: {
    // Existing rules plus our custom ones
    ...require('./.eslintrc.js').rules,
    
    // Prevent functions in their own dependency arrays
    'no-self-dependency': 'error',
    
    // Warn about missing dependencies that could cause stale closures
    'react-hooks/exhaustive-deps': [
      'warn',
      {
        additionalHooks: '(useCustomEffect|useRealtimeEffect)'
      }
    ],
    
    // Prevent polling patterns
    'no-polling-patterns': 'warn',
    
    // Require cleanup for subscriptions
    'require-subscription-cleanup': 'warn',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // TypeScript-specific rules
        '@typescript-eslint/no-misused-promises': [
          'error',
          {
            checksVoidReturn: {
              arguments: false,
              attributes: false,
            },
          },
        ],
      },
    },
  ],
};