#!/usr/bin/env ts-node

/**
 * Migration script to transfer chess endgame data from TypeScript arrays to Firestore
 * 
 * Usage:
 *   npm run migrate:firestore -- --dry-run    # Test migration without writing
 *   npm run migrate:firestore                 # Run full migration
 *   npm run migrate:firestore -- --verify     # Verify existing migration
 */

import { program } from 'commander';
import { FirestoreMigrationService } from '../shared/services/database/migrationService';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../shared/lib/firebase/config';
import chalk from 'chalk';

// Initialize Firebase for script
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configure command line options
program
  .name('migrate-to-firestore')
  .description('Migrate chess endgame data to Firestore')
  .option('--dry-run', 'Perform a dry run without writing to Firestore')
  .option('--verify', 'Verify existing migration')
  .option('--positions-only', 'Migrate only positions')
  .option('--categories-only', 'Migrate only categories')
  .option('--chapters-only', 'Migrate only chapters')
  .parse();

const options = program.opts();

async function main() {
  console.log(chalk.blue('🚀 Firestore Migration Tool'));
  console.log(chalk.gray('==========================\n'));

  const migrationService = new FirestoreMigrationService();

  // Verify mode
  if (options.verify) {
    console.log(chalk.yellow('🔍 Verifying existing migration...'));
    const isValid = await migrationService.verifyMigration();
    
    if (isValid) {
      console.log(chalk.green('✅ Migration verification passed!'));
    } else {
      console.log(chalk.red('❌ Migration verification failed!'));
      process.exit(1);
    }
    return;
  }

  // Dry run mode
  if (options.dryRun) {
    console.log(chalk.yellow('🏃 Running in DRY RUN mode - no data will be written'));
    console.log(chalk.gray('Remove --dry-run flag to perform actual migration\n'));
    
    // Just show what would be migrated
    const { allEndgamePositions, endgameCategories, endgameChapters } = require('../shared/data/endgames');
    
    console.log(chalk.cyan(`📊 Data to migrate:`));
    console.log(`  - Positions: ${allEndgamePositions.length}`);
    console.log(`  - Categories: ${endgameCategories.length}`);
    console.log(`  - Chapters: ${endgameChapters.length}`);
    console.log();
    
    return;
  }

  // Actual migration
  console.log(chalk.green('🔄 Starting migration to Firestore...\n'));

  try {
    let results;

    // Selective migration based on flags
    if (options.positionsOnly) {
      console.log(chalk.cyan('📍 Migrating positions only...'));
      results = {
        positions: await migrationService.migratePositions(),
        categories: { success: true, migratedCount: 0, errors: [] },
        chapters: { success: true, migratedCount: 0, errors: [] }
      };
    } else if (options.categoriesOnly) {
      console.log(chalk.cyan('📂 Migrating categories only...'));
      results = {
        positions: { success: true, migratedCount: 0, errors: [] },
        categories: await migrationService.migrateCategories(),
        chapters: { success: true, migratedCount: 0, errors: [] }
      };
    } else if (options.chaptersOnly) {
      console.log(chalk.cyan('📚 Migrating chapters only...'));
      results = {
        positions: { success: true, migratedCount: 0, errors: [] },
        categories: { success: true, migratedCount: 0, errors: [] },
        chapters: await migrationService.migrateChapters()
      };
    } else {
      // Full migration
      results = await migrationService.runFullMigration();
    }

    // Display results
    console.log(chalk.blue('\n📊 Migration Results:'));
    console.log(chalk.gray('-------------------'));

    // Positions
    if (results.positions.migratedCount > 0) {
      if (results.positions.success) {
        console.log(chalk.green(`✅ Positions: ${results.positions.migratedCount} migrated successfully`));
      } else {
        console.log(chalk.yellow(`⚠️  Positions: ${results.positions.migratedCount} migrated with ${results.positions.errors.length} errors`));
        results.positions.errors.forEach(err => console.log(chalk.red(`   - ${err}`)));
      }
    }

    // Categories
    if (results.categories.migratedCount > 0) {
      if (results.categories.success) {
        console.log(chalk.green(`✅ Categories: ${results.categories.migratedCount} migrated successfully`));
      } else {
        console.log(chalk.yellow(`⚠️  Categories: ${results.categories.migratedCount} migrated with ${results.categories.errors.length} errors`));
        results.categories.errors.forEach(err => console.log(chalk.red(`   - ${err}`)));
      }
    }

    // Chapters
    if (results.chapters.migratedCount > 0) {
      if (results.chapters.success) {
        console.log(chalk.green(`✅ Chapters: ${results.chapters.migratedCount} migrated successfully`));
      } else {
        console.log(chalk.yellow(`⚠️  Chapters: ${results.chapters.migratedCount} migrated with ${results.chapters.errors.length} errors`));
        results.chapters.errors.forEach(err => console.log(chalk.red(`   - ${err}`)));
      }
    }

    // Overall status
    const overallSuccess = results.positions.success && 
                          results.categories.success && 
                          results.chapters.success;

    console.log();
    if (overallSuccess) {
      console.log(chalk.green.bold('✨ Migration completed successfully!'));
      
      // Run verification
      console.log(chalk.yellow('\n🔍 Running verification...'));
      const isValid = await migrationService.verifyMigration();
      
      if (isValid) {
        console.log(chalk.green('✅ Verification passed!'));
      } else {
        console.log(chalk.red('❌ Verification failed - please check the logs'));
      }
    } else {
      console.log(chalk.red.bold('❌ Migration completed with errors'));
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('\n💥 Migration failed with error:'));
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
main().catch(error => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});