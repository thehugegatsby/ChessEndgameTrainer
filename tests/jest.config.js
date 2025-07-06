/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Root directory
  rootDir: '../',
  
  // Test match patterns
  testMatch: [
    '<rootDir>/tests/**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // Module path mapping (align with Next.js)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/shared/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@pages/(.*)$': '<rootDir>/pages/$1',
    '^@public/(.*)$': '<rootDir>/public/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    // Mock CSS modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Mock static assets
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/mocks/fileMock.js'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js',
    '<rootDir>/tests/setup/mocks.setup.js'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json'
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'shared/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    '!shared/**/*.d.ts',
    '!shared/**/__tests__/**',
    '!shared/**/node_modules/**',
    '!shared/**/*.stories.{ts,tsx}',
    '!shared/benchmarks/**',
    '!shared/tests/**'
  ],
  
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/shared/__tests__/', // Old test structure - ignore during migration
    '<rootDir>/shared/tests/'     // Old test structure - ignore during migration
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output for debugging
  verbose: false,
  
  // Test projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/unit/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.jest.json'
        }],
        '^.+\\.(js|jsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            ['@babel/preset-react', { runtime: 'automatic' }]
          ]
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/../shared/$1',
        '^@shared/(.*)$': '<rootDir>/../shared/$1',
        '^@pages/(.*)$': '<rootDir>/../pages/$1',
        '^@public/(.*)$': '<rootDir>/../public/$1',
        '^@tests/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/mocks/fileMock.js'
      }
    },
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/integration/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.jest.json'
        }],
        '^.+\\.(js|jsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            ['@babel/preset-react', { runtime: 'automatic' }]
          ]
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/../shared/$1',
        '^@shared/(.*)$': '<rootDir>/../shared/$1',
        '^@pages/(.*)$': '<rootDir>/../pages/$1',
        '^@public/(.*)$': '<rootDir>/../public/$1',
        '^@tests/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/mocks/fileMock.js'
      }
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/performance/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'node'
    },
    {
      displayName: 'regression',
      testMatch: ['<rootDir>/regression/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'jsdom'
    }
  ],
  
  // Global setup/teardown
  globalSetup: '<rootDir>/tests/setup/global.setup.js',
  globalTeardown: '<rootDir>/tests/setup/global.teardown.js',
  
  // Workers configuration for performance
  maxWorkers: '50%',
  
  // Error handling
  errorOnDeprecated: true,
  
  // Snapshot configuration
  // snapshotSerializers: [
  //   '@emotion/jest/serializer'  // Remove if not using emotion
  // ]
};

module.exports = config;