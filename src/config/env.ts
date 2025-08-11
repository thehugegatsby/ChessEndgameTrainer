/**
 * Environment Variable Configuration
 * 
 * Validates and types all environment variables at startup
 * using Zod for runtime validation and type safety.
 * 
 * This solves TS4111 errors from noPropertyAccessFromIndexSignature
 * and ensures all required env vars are present at startup.
 */

import { z } from 'zod';

/**
 * Environment variable schema definition
 * Defines all env vars, their types, and validation rules
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server ports
  PORT: z.coerce.number().int().positive().optional(),
  
  // Firebase configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  
  // Firebase admin (server-side)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_API_KEY: z.string().optional(),
  FIREBASE_AUTH_DOMAIN: z.string().optional(),
  
  // App configuration
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_TABLEBASE_API_URL: z.string().url().default('https://tablebase.lichess.ovh'),
  
  // Feature flags
  NEXT_PUBLIC_FIREBASE_ENABLED: z.coerce.boolean().default(false),
  NEXT_PUBLIC_ANALYTICS_ENABLED: z.coerce.boolean().default(false),
  NEXT_PUBLIC_IS_E2E_TEST: z.coerce.boolean().default(false),
  IS_E2E_TEST: z.coerce.boolean().default(false),
  
  // CI/CD
  CI: z.coerce.boolean().default(false),
  
  // Firebase emulator
  USE_EMULATOR: z.coerce.boolean().default(false),
  FIRESTORE_EMULATOR_HOST: z.string().optional(),
  
  // Testing
  RUN_INTEGRATION_TESTS: z.coerce.boolean().default(false),
  NEXT_PUBLIC_E2E_SIGNALS: z.coerce.boolean().default(false),
  USE_REAL_FIREBASE: z.coerce.boolean().default(false),
  NEXT_PUBLIC_USE_FIRESTORE: z.coerce.boolean().default(false),
  DEBUG_MOCK_SERVICE: z.coerce.boolean().default(false),
});

/**
 * Inferred type from the environment schema
 */
type EnvVars = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * Will throw an error at startup if validation fails
 */
const parseEnv = (): EnvVars => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
      throw new Error('Environment validation failed');
    }
    throw error;
  }
};

/**
 * Validated and typed environment configuration
 * Use this instead of process.env throughout the application
 */
export const env = parseEnv();

/**
 * Inferred type from the schema for use in other files
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Helper to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if we're in test environment
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Helper to check if Firebase is enabled
 */
export const isFirebaseEnabled = env.NEXT_PUBLIC_FIREBASE_ENABLED;

/**
 * Helper to check if we're running E2E tests
 */
export const isE2ETest = env.IS_E2E_TEST || env.NEXT_PUBLIC_IS_E2E_TEST;