import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E global teardown...');
  
  // Clean up any test data or resources here
  // For example, clean up test users, reset database state, etc.
  
  console.log('✅ E2E global teardown complete');
}

export default globalTeardown;