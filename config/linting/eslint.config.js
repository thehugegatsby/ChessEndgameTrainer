/**
 * ESLint Configuration with AI-Friendly Comments
 * 
 * 🤖 AI-NOTE: This file contains comprehensive explanations for every rule
 * 🤖 AI-RULE: When changing rules, UPDATE the comment explaining WHY
 * 🤖 AI-CONTEXT: Chess endgame training app with complex domain logic
 */

module.exports = {
  extends: [
    'next/core-web-vitals',  // Next.js recommended rules + performance
    'next/typescript'        // TypeScript-specific Next.js rules
  ],
  
  rules: {
    // 🤖 CONSOLE RULES - Allow warnings/errors for debugging, block console.log
    'no-console': ['error', { allow: ['warn', 'error'] }],
    
    // 🤖 VARIABLE RULES - Enforce immutability where possible
    'prefer-const': 'error',  // Chess positions should be immutable
    
    // 🤖 TYPESCRIPT RULES - Strict typing for chess logic reliability
    '@typescript-eslint/no-explicit-any': 'error',  // AI: Never use 'any' - causes unpredictable chess logic
    
    // 🤖 UNUSED VARIABLES - Allow underscore prefix for chess engine callbacks
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'after-used',           // Chess move handlers need all params
        varsIgnorePattern: '^_',     // _move, _position for ignored chess params
        argsIgnorePattern: '^_'      // _san, _fen for callback signatures
      }
    ],
    
    // 🤖 FUNCTION RETURNS - Critical for chess move validation
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,                      // React components can infer JSX
        allowTypedFunctionExpressions: true,        // Chess.js callbacks are typed
        allowHigherOrderFunctions: true,           // Zustand store creators
        allowDirectConstAssertionInArrowFunctions: true  // Chess constants
      }
    ],
    
    // 🤖 NULL SAFETY - Chess positions can be null, but must be explicit
    '@typescript-eslint/no-non-null-assertion': 'error',
    
    // 🤖 IMPORT STYLE - Performance optimization for large chess modules
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',      // Separate types from runtime for tree-shaking
        fixStyle: 'inline-type-imports'  // Keep imports clean
      }
    ],
    
    // 🤖 MUTATION RULES - Chess state must be immutable in React
    'no-param-reassign': [
      'error',
      {
        props: true,                           // Never mutate chess position props
        ignorePropertyModificationsFor: ['acc']  // Allow accumulator in reduce
      }
    ],
    
    // 🤖 COMPLEXITY LIMITS - LLM-optimized thresholds (no human devs)
    'no-nested-ternary': 'off',                // LLM can handle complex ternaries
    'complexity': ['warn', { max: 35 }],       // LLM: High threshold for safety net only
    'max-lines-per-function': [
      'warn', 
      { 
        max: 350,              // LLM: Can process long functions, prevent extreme cases
        skipBlankLines: true,   
        skipComments: true     
      }
    ],
    'max-depth': ['warn', { max: 8 }],        // LLM: Deep nesting OK, prevent logic errors
    
    // 🤖 LLM-SPECIFIC RULES - Prevent common LLM anti-patterns
    'no-magic-numbers': ['warn', {
      ignore: [0, 1, -1, 2, 8],  // Common chess: empty, true/false, board size
      ignoreArrayIndexes: true,
      enforceConst: true
    }]
  },
  
  // 🤖 ENVIRONMENT-SPECIFIC OVERRIDES
  overrides: [
    {
      // 🤖 TEST FILES - Relaxed rules for chess test scenarios
      files: [
        'scripts/**/*.js',
        'scripts/**/*.ts', 
        'config/**/*.js',
        'config/**/*.ts',
        'src/config/**/*.js',
        'src/config/**/*.ts',
        'config/testing/**/*.js',
        'config/testing/**/*.ts',
        'src/shared/services/logging/Logger.ts',
        'src/shared/services/container/ServiceContainer.ts', 
        'src/shared/store/slices/progressSlice.ts'
      ],
      rules: {
        // AI: Config files need flexibility for complex setup logic
        '@typescript-eslint/no-explicit-any': 'off',           // Configs may need any for generic setup
        '@typescript-eslint/explicit-function-return-type': 'off', // Build scripts don't need return types
        'no-console': 'off',                                   // Scripts need logging
        'complexity': 'off',                                   // Config logic can be complex
        'max-lines-per-function': 'off',                      // Setup functions can be long
        'max-depth': 'off',                                   // Config nesting unlimited
        'no-magic-numbers': 'off'                             // Configs use literal values
      }
    },
    {
      // 🤖 TEST FILES - Special rules for chess game testing
      files: [
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}',
        'src/tests/**/*.{ts,tsx,js,jsx}',
        'e2e/**/*.{ts,tsx,js,jsx}'
      ],
      rules: {
        // AI: Tests need flexibility for chess game scenarios and mocks
        '@typescript-eslint/no-explicit-any': 'warn',         // Tests may mock with any
        '@typescript-eslint/no-unused-vars': 'off',          // Test fixtures have unused vars
        '@typescript-eslint/explicit-function-return-type': 'off', // Test functions don't need return types
        'no-console': 'off',                                  // Tests can log for debugging
        'complexity': 'off',                                  // LLM: Tests can be arbitrarily complex
        'max-depth': 'off',                                   // LLM: Test nesting unlimited
        'max-lines-per-function': 'off',                     // LLM: Test scenarios can be long
        'no-magic-numbers': 'off'                            // Tests use many literal values
      }
    }
  ]
};