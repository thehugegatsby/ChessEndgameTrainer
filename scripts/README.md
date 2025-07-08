# Scripts Directory

This directory contains utility scripts for migration, code analysis, and maintenance tasks.

## Essential Scripts

### Database Migration

#### `migrateToFirestore.ts`
Production-ready database migration script for moving data from local TypeScript arrays to Firebase Firestore.

**Usage:**
```bash
npm run migrate:firestore          # Run full migration
npm run migrate:firestore -- --dry-run  # Test migration without writing
npm run migrate:verify             # Verify existing migration
```

**Features:**
- Batch processing respecting Firestore's 500 document limit
- Dry-run mode for testing
- Verification mode to check migration success
- Proper error handling and rollback capabilities

#### `runMigration.js`
Wrapper script that sets up the Node.js environment for running the TypeScript migration script.

## Code Analysis Scripts

These scripts help maintain code quality by detecting various issues:

### `check-duplicate-components.js`
Detects duplicate component names and naming conflicts across the codebase.

**Usage:**
```bash
npm run check-duplicates
```

### `check-unused-services.js`
Analyzes service files to find potentially unused services.

**Usage:**
```bash
node scripts/check-unused-services.js
```

### `deep-unused-analysis.js`
Performs comprehensive analysis to find unused code including:
- Unused exports
- Unused functions
- Dead code paths

**Usage:**
```bash
node scripts/deep-unused-analysis.js
```

### `find-unused-files.js`
Identifies files that are not imported anywhere in the codebase.

**Usage:**
```bash
node scripts/find-unused-files.js
```

## Adding New Scripts

When adding new scripts to this directory:

1. **Categorize appropriately**: Is it a one-time debug script or a reusable utility?
2. **No hardcoded credentials**: Use environment variables for any sensitive data
3. **Document usage**: Add documentation to this README
4. **Consider npm scripts**: If the script will be used regularly, add it to package.json

## Cleanup Policy

Debug and test scripts should be removed after use to prevent:
- Security risks from hardcoded credentials
- Confusion about which scripts are production-ready
- Accumulation of technical debt

Last cleanup: 2025-07-08