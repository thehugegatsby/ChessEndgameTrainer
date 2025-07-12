/**
 * Firebase Batch Seeder
 * High-performance batch operations for Firebase test data seeding
 * Implements enterprise patterns for efficient data loading and validation
 */

import { 
  type Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { initializeTestFirebase } from '../utils/firebase-test-helpers';
import { FIREBASE_TEST_CONFIG } from '../e2e/firebase/firebase.constants';
import { EndgamePosition, EndgameCategory, EndgameChapter } from '@shared/types/endgame';

// Batch operation configuration
const BATCH_CONFIG = {
  MAX_BATCH_SIZE: 500,           // Firestore batch limit
  OPTIMAL_BATCH_SIZE: 100,       // Optimal performance size
  MAX_CONCURRENT_BATCHES: 5,     // Parallel batch limit
  RETRY_ATTEMPTS: 3,             // Retry failed operations
  RETRY_DELAY: 1000             // Delay between retries (ms)
} as const;

// Progress tracking interface
export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  estimatedTimeRemaining: number;
  currentOperation: string;
}

// Batch operation result
export interface BatchSeedResult {
  success: boolean;
  results: Record<string, number>;
  errors: Array<{ operation: string; error: string; data?: any }>;
  duration: number;
  progress: BatchProgress;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Advanced seeding options
export interface AdvancedSeedOptions {
  validateData?: boolean;
  clearExisting?: boolean;
  onProgress?: (progress: BatchProgress) => void;
  enableRetries?: boolean;
  parallelism?: number;
  transactional?: boolean;
  skipValidation?: boolean;
}

/**
 * High-performance Firebase batch seeder with enterprise features
 */
export class FirebaseBatchSeeder {
  private db: Firestore | null = null;
  private startTime = 0;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Initialize Firestore connection
   */
  private async getDb(): Promise<Firestore> {
    if (!this.db) {
      this.db = await initializeTestFirebase();
    }
    return this.db;
  }

  /**
   * Validate positions data before seeding
   */
  private validatePositions(positions: EndgamePosition[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(positions)) {
      errors.push('Positions must be an array');
      return { isValid: false, errors, warnings };
    }

    const seenIds = new Set<number>();
    
    positions.forEach((position, index) => {
      // Required fields validation
      if (!position.id) {
        errors.push(`Position at index ${index}: missing required field 'id'`);
      } else if (seenIds.has(position.id)) {
        errors.push(`Position at index ${index}: duplicate ID ${position.id}`);
      } else {
        seenIds.add(position.id);
      }

      if (!position.title?.trim()) {
        errors.push(`Position ${position.id}: missing or empty title`);
      }

      if (!position.fen?.match(/^[rnbqkpRNBQKP1-8/\s\-]+$/)) {
        errors.push(`Position ${position.id}: invalid FEN format`);
      }

      if (!position.category?.trim()) {
        errors.push(`Position ${position.id}: missing category`);
      }

      if (position.difficulty && !['beginner', 'intermediate', 'advanced', 'master'].includes(position.difficulty)) {
        errors.push(`Position ${position.id}: invalid difficulty '${position.difficulty}'`);
      }

      if (position.sideToMove && !['white', 'black'].includes(position.sideToMove)) {
        errors.push(`Position ${position.id}: invalid sideToMove '${position.sideToMove}'`);
      }

      if (position.goal && !['win', 'draw', 'loss'].includes(position.goal)) {
        errors.push(`Position ${position.id}: invalid goal '${position.goal}'`);
      }

      // Warnings for optional but recommended fields
      if (!position.description?.trim()) {
        warnings.push(`Position ${position.id}: missing description`);
      }

      if (!position.hints?.length) {
        warnings.push(`Position ${position.id}: no hints provided`);
      }

      if (!position.solution?.length) {
        warnings.push(`Position ${position.id}: no solution provided`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate categories data before seeding
   */
  private validateCategories(categories: EndgameCategory[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(categories)) {
      errors.push('Categories must be an array');
      return { isValid: false, errors, warnings };
    }

    const seenIds = new Set<string>();
    
    categories.forEach((category, index) => {
      if (!category.id?.trim()) {
        errors.push(`Category at index ${index}: missing required field 'id'`);
      } else if (seenIds.has(category.id)) {
        errors.push(`Category at index ${index}: duplicate ID '${category.id}'`);
      } else {
        seenIds.add(category.id);
      }

      if (!category.name?.trim()) {
        errors.push(`Category ${category.id}: missing or empty name`);
      }

      if (!category.description?.trim()) {
        warnings.push(`Category ${category.id}: missing description`);
      }

      if (!category.icon?.trim()) {
        warnings.push(`Category ${category.id}: missing icon`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate chapters data before seeding
   */
  private validateChapters(chapters: EndgameChapter[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(chapters)) {
      errors.push('Chapters must be an array');
      return { isValid: false, errors, warnings };
    }

    const seenIds = new Set<string>();
    
    chapters.forEach((chapter, index) => {
      if (!chapter.id?.trim()) {
        errors.push(`Chapter at index ${index}: missing required field 'id'`);
      } else if (seenIds.has(chapter.id)) {
        errors.push(`Chapter at index ${index}: duplicate ID '${chapter.id}'`);
      } else {
        seenIds.add(chapter.id);
      }

      if (!chapter.name?.trim()) {
        errors.push(`Chapter ${chapter.id}: missing or empty name`);
      }

      if (!chapter.category?.trim()) {
        errors.push(`Chapter ${chapter.id}: missing category reference`);
      }

      if (typeof chapter.totalLessons !== 'number' || chapter.totalLessons < 0) {
        errors.push(`Chapter ${chapter.id}: invalid totalLessons value`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create progress tracker
   */
  private createProgressTracker(total: number, onProgress?: (progress: BatchProgress) => void) {
    let completed = 0;
    let failed = 0;
    let currentOperation = 'Initializing...';
    const startTime = Date.now();

    return {
      update: (operation: string, success: boolean = true) => {
        currentOperation = operation;
        if (success) {
          completed++;
        } else {
          failed++;
        }

        const elapsed = Date.now() - startTime;
        const rate = completed / elapsed * 1000; // items per second
        const remaining = total - completed - failed;
        const estimatedTimeRemaining = rate > 0 ? Math.round(remaining / rate * 1000) : 0;
        
        const progress: BatchProgress = {
          total,
          completed,
          failed,
          percentage: Math.round((completed + failed) / total * 100),
          estimatedTimeRemaining,
          currentOperation
        };

        if (onProgress) {
          onProgress(progress);
        }

        return progress;
      },
      getProgress: (): BatchProgress => ({
        total,
        completed,
        failed,
        percentage: Math.round((completed + failed) / total * 100),
        estimatedTimeRemaining: 0,
        currentOperation
      })
    };
  }

  /**
   * Batch write with automatic chunking and retry logic
   */
  private async batchWrite(
    operations: Array<{ collection: string; id: string; data: any }>,
    tracker: ReturnType<typeof this.createProgressTracker>,
    options: AdvancedSeedOptions = {}
  ): Promise<{ success: number; errors: Array<{ operation: string; error: string; data?: any }> }> {
    const db = await this.getDb();
    const { enableRetries = true, parallelism = BATCH_CONFIG.MAX_CONCURRENT_BATCHES } = options;
    
    const chunks = [];
    for (let i = 0; i < operations.length; i += BATCH_CONFIG.OPTIMAL_BATCH_SIZE) {
      chunks.push(operations.slice(i, i + BATCH_CONFIG.OPTIMAL_BATCH_SIZE));
    }

    const errors: Array<{ operation: string; error: string; data?: any }> = [];
    let successCount = 0;

    // Process chunks with controlled parallelism
    for (let i = 0; i < chunks.length; i += parallelism) {
      const batchPromises = chunks.slice(i, i + parallelism).map(async (chunk, chunkIndex) => {
        const actualIndex = i + chunkIndex;
        return this.processBatchChunk(chunk, actualIndex, tracker, enableRetries);
      });

      const results = await Promise.allSettled(batchPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount += result.value.success;
          errors.push(...result.value.errors);
        } else {
          errors.push({
            operation: `Batch chunk ${i + index}`,
            error: result.reason?.message || 'Unknown batch error'
          });
        }
      });
    }

    return { success: successCount, errors };
  }

  /**
   * Process individual batch chunk with retry logic
   */
  private async processBatchChunk(
    operations: Array<{ collection: string; id: string; data: any }>,
    chunkIndex: number,
    tracker: ReturnType<typeof this.createProgressTracker>,
    enableRetries: boolean
  ): Promise<{ success: number; errors: Array<{ operation: string; error: string; data?: any }> }> {
    const db = await this.getDb();
    let attempt = 0;
    const errors: Array<{ operation: string; error: string; data?: any }> = [];

    while (attempt < BATCH_CONFIG.RETRY_ATTEMPTS) {
      try {
        const batch = writeBatch(db);
        
        operations.forEach(({ collection: collectionName, id, data }) => {
          const docRef = doc(db, collectionName, id);
          batch.set(docRef, {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            testBatch: true
          });
        });

        await batch.commit();
        
        // Update progress for successful operations
        operations.forEach((op, index) => {
          tracker.update(`Seeded ${op.collection} ${op.id}`, true);
        });

        return { success: operations.length, errors: [] };

      } catch (error) {
        attempt++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt >= BATCH_CONFIG.RETRY_ATTEMPTS || !enableRetries) {
          // Final failure - track each operation as failed
          operations.forEach((op) => {
            tracker.update(`Failed ${op.collection} ${op.id}`, false);
            errors.push({
              operation: `${op.collection}:${op.id}`,
              error: errorMessage,
              data: op.data
            });
          });
          break;
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.RETRY_DELAY * attempt));
        }
      }
    }

    return { success: 0, errors };
  }

  /**
   * Advanced batch seed with comprehensive validation and progress tracking
   */
  async seedBatchAdvanced(data: {
    positions?: EndgamePosition[];
    categories?: EndgameCategory[];
    chapters?: EndgameChapter[];
  }, options: AdvancedSeedOptions = {}): Promise<BatchSeedResult> {
    const startTime = Date.now();
    const {
      validateData = true,
      clearExisting = false,
      onProgress,
      enableRetries = true,
      parallelism = BATCH_CONFIG.MAX_CONCURRENT_BATCHES,
      transactional = false
    } = options;

    const { positions = [], categories = [], chapters = [] } = data;
    const totalOperations = positions.length + categories.length + chapters.length;
    
    const result: BatchSeedResult = {
      success: false,
      results: { positions: 0, categories: 0, chapters: 0 },
      errors: [],
      duration: 0,
      progress: {
        total: totalOperations,
        completed: 0,
        failed: 0,
        percentage: 0,
        estimatedTimeRemaining: 0,
        currentOperation: 'Starting...'
      }
    };

    if (totalOperations === 0) {
      result.success = true;
      result.duration = Date.now() - startTime;
      return result;
    }

    const tracker = this.createProgressTracker(totalOperations, onProgress);

    try {
      // Validation phase
      if (validateData) {
        tracker.update('Validating data...');
        
        const validationResults = [
          this.validatePositions(positions),
          this.validateCategories(categories),
          this.validateChapters(chapters)
        ];

        const allErrors = validationResults.flatMap(r => r.errors);
        if (allErrors.length > 0) {
          result.errors.push({
            operation: 'validation',
            error: `Validation failed: ${allErrors.join(', ')}`
          });
          result.duration = Date.now() - startTime;
          return result;
        }
      }

      // Clear existing data if requested
      if (clearExisting) {
        tracker.update('Clearing existing data...');
        await this.clearCollections(['positions', 'categories', 'chapters']);
      }

      // Prepare batch operations
      const operations: Array<{ collection: string; id: string; data: any }> = [
        ...categories.map(cat => ({ collection: 'categories', id: cat.id, data: cat })),
        ...chapters.map(chapter => ({ collection: 'chapters', id: chapter.id, data: chapter })),
        ...positions.map(pos => ({ collection: 'positions', id: pos.id.toString(), data: pos }))
      ];

      // Execute batch operations
      if (transactional && totalOperations <= BATCH_CONFIG.OPTIMAL_BATCH_SIZE) {
        // Use transaction for smaller datasets
        const transactionResult = await this.executeTransaction(operations, tracker);
        result.results.positions = positions.length;
        result.results.categories = categories.length; 
        result.results.chapters = chapters.length;
        result.errors.push(...transactionResult.errors);
      } else {
        // Use batch writes for larger datasets
        const batchResult = await this.batchWrite(operations, tracker, {
          enableRetries,
          parallelism
        });
        
        result.results.positions = positions.length - batchResult.errors.filter(e => e.operation.startsWith('positions:')).length;
        result.results.categories = categories.length - batchResult.errors.filter(e => e.operation.startsWith('categories:')).length;
        result.results.chapters = chapters.length - batchResult.errors.filter(e => e.operation.startsWith('chapters:')).length;
        result.errors.push(...batchResult.errors);
      }

      result.success = result.errors.length === 0;
      result.progress = tracker.getProgress();
      result.duration = Date.now() - startTime;

      return result;

    } catch (error) {
      result.errors.push({
        operation: 'batch_seed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      result.duration = Date.now() - startTime;
      result.progress = tracker.getProgress();
      return result;
    }
  }

  /**
   * Execute operations in a single transaction (for smaller datasets)
   */
  private async executeTransaction(
    operations: Array<{ collection: string; id: string; data: any }>,
    tracker: ReturnType<typeof this.createProgressTracker>
  ): Promise<{ success: number; errors: Array<{ operation: string; error: string; data?: any }> }> {
    const db = await this.getDb();
    
    try {
      await runTransaction(db, async (transaction) => {
        operations.forEach(({ collection: collectionName, id, data }) => {
          const docRef = doc(db, collectionName, id);
          transaction.set(docRef, {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            testBatch: true
          });
        });
      });

      // Update progress for all operations
      operations.forEach((op) => {
        tracker.update(`Seeded ${op.collection} ${op.id}`, true);
      });

      return { success: operations.length, errors: [] };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      
      // Mark all operations as failed
      const errors = operations.map((op) => {
        tracker.update(`Failed ${op.collection} ${op.id}`, false);
        return {
          operation: `${op.collection}:${op.id}`,
          error: errorMessage,
          data: op.data
        };
      });

      return { success: 0, errors };
    }
  }

  /**
   * Clear specific collections
   */
  private async clearCollections(collectionNames: string[]): Promise<void> {
    const db = await this.getDb();
    
    for (const collectionName of collectionNames) {
      const snapshot = await getDocs(collection(db, collectionName));
      
      if (snapshot.size > 0) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(document => {
          batch.delete(document.ref);
        });
        await batch.commit();
      }
    }
  }

  /**
   * Get seeding statistics
   */
  async getSeedingStats(): Promise<{
    collections: Record<string, number>;
    totalDocuments: number;
    lastSeeded: Date | null;
  }> {
    const db = await this.getDb();
    
    const [positionsSnapshot, categoriesSnapshot, chaptersSnapshot] = await Promise.all([
      getDocs(collection(db, 'positions')),
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'chapters'))
    ]);

    const collections = {
      positions: positionsSnapshot.size,
      categories: categoriesSnapshot.size,
      chapters: chaptersSnapshot.size
    };

    const totalDocuments = Object.values(collections).reduce((sum, count) => sum + count, 0);
    
    // Find most recent document timestamp
    let lastSeeded: Date | null = null;
    const allDocs = [
      ...positionsSnapshot.docs,
      ...categoriesSnapshot.docs,
      ...chaptersSnapshot.docs
    ];

    allDocs.forEach(doc => {
      const data = doc.data();
      if (data.createdAt?.toDate) {
        const createdAt = data.createdAt.toDate();
        if (!lastSeeded || createdAt > lastSeeded) {
          lastSeeded = createdAt;
        }
      }
    });

    return {
      collections,
      totalDocuments,
      lastSeeded
    };
  }
}