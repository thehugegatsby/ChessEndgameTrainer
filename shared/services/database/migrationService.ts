import { collection, doc, writeBatch, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import { allEndgamePositions, endgameCategories, endgameChapters } from '@shared/data/endgames';
import { getLogger } from '@shared/services/logging';

const logger = getLogger();

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
}

/**
 * Service for migrating chess endgame data from TypeScript arrays to Firestore
 */
export class FirestoreMigrationService {
  private batchSize = 500; // Firestore batch limit

  /**
   * Migrate all positions to Firestore
   */
  async migratePositions(): Promise<MigrationResult> {
    logger.info('Starting position migration to Firestore');
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // Process in batches to respect Firestore limits
      for (let i = 0; i < allEndgamePositions.length; i += this.batchSize) {
        const batch = writeBatch(db);
        const batchPositions = allEndgamePositions.slice(i, i + this.batchSize);

        for (const position of batchPositions) {
          try {
            const docRef = doc(collection(db, 'positions'), position.id.toString());
            
            // Transform data for Firestore
            const firestoreData = {
              ...position,
              // Add timestamps
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
              // Ensure arrays are properly formatted
              tags: position.tags || [],
              prerequisites: position.prerequisites || [],
              // Flatten nested content if needed
              baseContent: {
                strategies: position.baseContent?.strategies || [],
                commonMistakes: position.baseContent?.commonMistakes || [],
                keyPrinciples: position.baseContent?.keyPrinciples || []
              },
              specialContent: {
                keySquares: position.specialContent?.keySquares || [],
                criticalMoves: position.specialContent?.criticalMoves || [],
                historicalNote: position.specialContent?.historicalNote,
                specificTips: position.specialContent?.specificTips || []
              },
              bridgeHints: position.bridgeHints || []
            };

            batch.set(docRef, firestoreData);
            migratedCount++;
          } catch (error) {
            const errorMsg = `Failed to prepare position ${position.id}: ${error}`;
            logger.error(errorMsg);
            errors.push(errorMsg);
          }
        }

        // Commit the batch
        await batch.commit();
        logger.info(`Migrated batch of ${batchPositions.length} positions`);
      }

      logger.info(`Successfully migrated ${migratedCount} positions`);
      return {
        success: errors.length === 0,
        migratedCount,
        errors
      };
    } catch (error) {
      const errorMsg = `Position migration failed: ${error}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
      return {
        success: false,
        migratedCount,
        errors
      };
    }
  }

  /**
   * Migrate category metadata to Firestore
   */
  async migrateCategories(): Promise<MigrationResult> {
    logger.info('Starting category migration to Firestore');
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      const batch = writeBatch(db);

      for (const category of endgameCategories) {
        try {
          const docRef = doc(collection(db, 'categories'), category.id);
          
          const firestoreData = {
            ...category,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            // Count positions in this category
            positionCount: allEndgamePositions.filter(p => p.category === category.id).length
          };

          batch.set(docRef, firestoreData);
          migratedCount++;
        } catch (error) {
          const errorMsg = `Failed to prepare category ${category.id}: ${error}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      await batch.commit();
      logger.info(`Successfully migrated ${migratedCount} categories`);

      return {
        success: errors.length === 0,
        migratedCount,
        errors
      };
    } catch (error) {
      const errorMsg = `Category migration failed: ${error}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
      return {
        success: false,
        migratedCount,
        errors
      };
    }
  }

  /**
   * Migrate chapters to Firestore
   */
  async migrateChapters(): Promise<MigrationResult> {
    logger.info('Starting chapter migration to Firestore');
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      const batch = writeBatch(db);

      for (const chapter of endgameChapters) {
        try {
          const docRef = doc(collection(db, 'chapters'), chapter.id);
          
          const firestoreData = {
            ...chapter,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            // Ensure lessons array contains position IDs
            lessons: chapter.lessons.map(lesson => lesson.id),
            prerequisites: [] // Add if chapters have prerequisites
          };

          batch.set(docRef, firestoreData);
          migratedCount++;
        } catch (error) {
          const errorMsg = `Failed to prepare chapter ${chapter.id}: ${error}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      await batch.commit();
      logger.info(`Successfully migrated ${migratedCount} chapters`);

      return {
        success: errors.length === 0,
        migratedCount,
        errors
      };
    } catch (error) {
      const errorMsg = `Chapter migration failed: ${error}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
      return {
        success: false,
        migratedCount,
        errors
      };
    }
  }

  /**
   * Run full migration
   */
  async runFullMigration(): Promise<{
    positions: MigrationResult;
    categories: MigrationResult;
    chapters: MigrationResult;
  }> {
    logger.info('Starting full Firestore migration');

    const results = {
      positions: await this.migratePositions(),
      categories: await this.migrateCategories(),
      chapters: await this.migrateChapters()
    };

    const totalSuccess = results.positions.success && 
                        results.categories.success && 
                        results.chapters.success;

    if (totalSuccess) {
      logger.info('Full migration completed successfully');
    } else {
      logger.error('Migration completed with errors', {
        positionErrors: results.positions.errors,
        categoryErrors: results.categories.errors,
        chapterErrors: results.chapters.errors
      });
    }

    return results;
  }

  /**
   * Verify migration by comparing counts
   */
  async verifyMigration(): Promise<boolean> {
    try {
      // Check position count
      const positionsRef = collection(db, 'positions');
      const positionsSnapshot = await getDocs(positionsRef);
      const firestorePositionCount = positionsSnapshot.size;
      const arrayPositionCount = allEndgamePositions.length;

      if (firestorePositionCount !== arrayPositionCount) {
        logger.error(`Position count mismatch: Firestore=${firestorePositionCount}, Array=${arrayPositionCount}`);
        return false;
      }

      // Check category count
      const categoriesRef = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      const firestoreCategoryCount = categoriesSnapshot.size;
      const arrayCategoryCount = endgameCategories.length;

      if (firestoreCategoryCount !== arrayCategoryCount) {
        logger.error(`Category count mismatch: Firestore=${firestoreCategoryCount}, Array=${arrayCategoryCount}`);
        return false;
      }

      // Check chapter count
      const chaptersRef = collection(db, 'chapters');
      const chaptersSnapshot = await getDocs(chaptersRef);
      const firestoreChapterCount = chaptersSnapshot.size;
      const arrayChapterCount = endgameChapters.length;

      if (firestoreChapterCount !== arrayChapterCount) {
        logger.error(`Chapter count mismatch: Firestore=${firestoreChapterCount}, Array=${arrayChapterCount}`);
        return false;
      }

      logger.info('Migration verification passed');
      return true;
    } catch (error) {
      logger.error('Migration verification failed', error);
      return false;
    }
  }
}