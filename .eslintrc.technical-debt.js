/**
 * ESLint rules for addressing technical debt
 * These rules enforce consistency and prevent future debt accumulation
 * 
 * To use: merge these rules into your main .eslintrc.js
 */

module.exports = {
  rules: {
    // Enforce consistent null/undefined usage
    '@typescript-eslint/no-unnecessary-condition': ['error', {
      allowConstantLoopConditions: true,
    }],
    
    // Prevent null ?? undefined patterns
    '@typescript-eslint/prefer-nullish-coalescing': ['error', {
      ignoreConditionalTests: false,
      ignoreTernaryTests: false,
      ignoreMixedLogicalExpressions: false,
      allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
    }],
    
    // Enforce strict equality to catch null/undefined issues
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    
    // Prevent confusing void expressions
    '@typescript-eslint/no-confusing-void-expression': ['error', {
      ignoreArrowShorthand: false,
      ignoreVoidOperator: false,
    }],
    
    // Enforce return types on functions (prevents implicit any)
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true,
      allowDirectConstAssertionInArrowFunctions: true,
    }],
    
    // Prevent any types
    '@typescript-eslint/no-explicit-any': 'error',
    
    // Enforce consistent type imports
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
      fixStyle: 'inline-type-imports',
    }],
    
    // Warn about deprecated usage
    'deprecation/deprecation': 'warn',
    
    // Enforce maximum file length to prevent monoliths
    'max-lines': ['warn', {
      max: 500,
      skipBlankLines: true,
      skipComments: true,
    }],
    
    // Enforce maximum function length
    'max-lines-per-function': ['warn', {
      max: 50,
      skipBlankLines: true,
      skipComments: true,
      IIFEs: true,
    }],
    
    // Complexity warnings
    'complexity': ['warn', 10],
    
    // Enforce consistent naming
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I'],
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
      {
        selector: 'enum',
        format: ['PascalCase'],
      },
    ],
  },
  
  // Required plugins
  plugins: [
    '@typescript-eslint',
    'deprecation',
  ],
  
  // Parser options
  parserOptions: {
    project: './tsconfig.json',
  },
};