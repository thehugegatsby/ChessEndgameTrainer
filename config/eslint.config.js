const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  // Extend Next.js config
  ...compat.extends('next/core-web-vitals'),
  
  // Global rules
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: './tests/e2e/components/AppDriver',
              message: 'AppDriver is deprecated. Use ModernDriver instead. See: docs/MODERNDRIVER_MIGRATION.md',
            },
            {
              name: '../components/AppDriver',
              message: 'AppDriver is deprecated. Use ModernDriver instead. See: docs/MODERNDRIVER_MIGRATION.md',
            },
            {
              name: '../../components/AppDriver',
              message: 'AppDriver is deprecated. Use ModernDriver instead. See: docs/MODERNDRIVER_MIGRATION.md',
            },
          ],
          patterns: [
            {
              group: ['**/AppDriver', '**/AppDriver.ts'],
              message: 'AppDriver is deprecated. Use ModernDriver instead. See: docs/MODERNDRIVER_MIGRATION.md',
            },
          ],
        },
      ],
    },
  },
  
  // E2E specific rules
  {
    files: ['tests/e2e/**/*.ts', 'tests/e2e/**/*.tsx'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];