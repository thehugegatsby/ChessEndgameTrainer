#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Run the migration
require('child_process').execSync(
  'npx ts-node --project tsconfig.scripts.json -r tsconfig-paths/register scripts/migrateToFirestore.ts',
  { stdio: 'inherit' }
);