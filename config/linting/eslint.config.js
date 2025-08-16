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
    
    // 🤖 COMPLEXITY LIMITS - Hybrid soft/hard thresholds based on AI model consensus
    // Gemini-2.5-Pro: "Low-cost insurance for maintainability"
    // GPT-5 + O3: "Soft thresholds with justified exceptions"
    'no-nested-ternary': 'off',                // LLM can handle complex ternaries
    
    // BASELINE LIMITS - Apply to most code
    'complexity': ['warn', { max: 25 }],       // Moderate: Balanced for AI + structure
    'max-lines-per-function': [
      'warn', 
      { 
        max: 150,              // Reduced: Better AI navigation, still flexible
        skipBlankLines: true,   
        skipComments: true     
      }
    ],
    'max-depth': ['warn', { max: 6 }],        // Reduced: Prevent deep nesting bugs
    
    // HARD LIMITS - Prevent extreme cases only
    '@typescript-eslint/max-params': ['error', { max: 6 }],  // Too many params = design issue
    'max-nested-callbacks': ['error', { max: 5 }],           // Callback hell prevention
    
    // EXCEPTION MECHANISM - Allow justified complexity
    'no-warning-comments': [
      'warn',
      {
        terms: ['complexity-waiver', 'TODO-REFACTOR'],
        location: 'start'
      }
    ]
    
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
      // 🤖 CORE BUSINESS LOGIC - Stricter limits for critical code
      files: [
        'src/features/**/*.ts',
        'src/features/**/*.tsx',
        'src/shared/chess/**/*.ts',
        'src/shared/game/**/*.ts'
      ],
      rules: {
        'complexity': ['warn', { max: 15 }],           // Strict: Critical chess logic
        'max-lines-per-function': ['warn', { max: 80 }], // Strict: Core functions small
        'max-depth': ['warn', { max: 4 }]               // Strict: Reduce nesting
      }
    },
    {
      // 🤖 ORCHESTRATORS - Legacy limits until refactoring
      files: [
        'src/shared/store/orchestrators/**/*.ts',
        'src/shared/store/slices/**/*.ts'
      ],
      rules: {
        'complexity': ['warn', { max: 35 }],           // Legacy: Keep current until #172
        'max-lines-per-function': ['warn', { max: 350 }], // Legacy: Allow long orchestrators
        'max-depth': ['warn', { max: 8 }]               // Legacy: Deep state logic OK
      }
    },
    {
      // 🤖 CONFIG & SCRIPT FILES - Relaxed rules for setup logic
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