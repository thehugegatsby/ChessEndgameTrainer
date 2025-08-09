/**
 * @file ProgressService
 * @description Firebase Firestore service for user progress tracking and spaced repetition
 * 
 * This service manages user progress data in Firestore using a subcollection architecture:
 * - users/{userId}/userProgress/stats - Single UserStats document
 * - users/{userId}/userProgress/{positionId} - Individual CardProgress documents
 * 
 * @example
 * ```typescript
 * const service = new ProgressService(db);
 * 
 * // Update user stats
 * await service.updateUserStats('user123', { totalPositionsCompleted: increment(1) });
 * 
 * // Update card progress with spaced repetition
 * await service.upsertCardProgress('user123', 'pos456', cardProgress);
 * 
 * // Batch update after training session
 * await service.updateProgressTransaction('user123', statsUpdate, cardUpdates);
 * ```
 */

import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  collection,
  getDocs,
  WithFieldValue,
  DocumentData,
  serverTimestamp,
  runTransaction,
  Transaction,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

import type { UserStats, CardProgress } from '@shared/store/slices/types';
import { getLogger } from '@shared/services/logging/Logger';

const logger = getLogger().setContext('ProgressService');

/**
 * Error messages in German for user-facing errors
 */
const ERROR_MESSAGES = {
  FIRESTORE_ERROR: 'Datenbankfehler. Bitte versuchen Sie es später erneut.',
  VALIDATION_ERROR: 'Ungültige Fortschrittsdaten.',
  USER_NOT_FOUND: 'Benutzerdaten nicht gefunden.',
  CARD_NOT_FOUND: 'Kartenfortschritt nicht gefunden.',
  BATCH_TOO_LARGE: 'Zu viele Änderungen auf einmal. Bitte in kleineren Mengen versuchen.',
  INVALID_USER_ID: 'Ungültige Benutzer-ID.',
  INVALID_POSITION_ID: 'Ungültige Positions-ID.',
} as const;

/**
 * Configuration interface for ProgressService
 */
export interface ProgressServiceConfig {
  /** Maximum batch size for Firestore operations (default: 500) */
  maxBatchSize?: number;
  /** Enable detailed logging (default: false) */
  enableVerboseLogging?: boolean;
}

/**
 * Firestore converter for UserStats with validation
 */
const userStatsConverter = {
  toFirestore(stats: WithFieldValue<UserStats>): DocumentData {
    // Validate before saving
    if (typeof stats === 'object' && stats !== null && 'overallSuccessRate' in stats) {
      const rate = stats.overallSuccessRate as number;
      if (rate < 0 || rate > 1) {
        throw new Error(ERROR_MESSAGES.VALIDATION_ERROR);
      }
    }
    
    return {
      ...stats,
      lastUpdated: serverTimestamp(), // Add server timestamp
    };
  },
  
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): UserStats {
    const data = snapshot.data();
    return {
      userId: data.userId,
      totalPositionsCompleted: data.totalPositionsCompleted || 0,
      overallSuccessRate: data.overallSuccessRate || 0,
      totalTimeSpent: data.totalTimeSpent || 0,
      totalHintsUsed: data.totalHintsUsed || 0,
      lastActive: data.lastActive?.toMillis?.() || data.lastActive || Date.now(),
    };
  },
};

/**
 * Firestore converter for CardProgress with validation
 */
const cardProgressConverter = {
  toFirestore(progress: WithFieldValue<CardProgress>): DocumentData {
    // Exclude 'id' since it becomes the document ID
    const { id, ...data } = progress as CardProgress;
    
    // Validate ease factor bounds (SuperMemo-2 standard)
    if ('efactor' in data && (data.efactor < 1.3 || data.efactor > 2.5)) {
      logger.warn('EFactor out of bounds, clamping', { 
        id, 
        efactor: data.efactor,
        clamped: Math.max(1.3, Math.min(2.5, data.efactor))
      });
      data.efactor = Math.max(1.3, Math.min(2.5, data.efactor));
    }
    
    return {
      ...data,
      lastUpdated: serverTimestamp(),
    };
  },
  
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): CardProgress {
    const data = snapshot.data();
    return {
      id: snapshot.id, // Use document ID as card ID
      nextReviewAt: data.nextReviewAt || 0,
      lastReviewedAt: data.lastReviewedAt || 0,
      interval: data.interval || 0,
      repetition: data.repetition || 0,
      efactor: data.efactor || 2.5,
      lapses: data.lapses || 0,
    };
  },
};

/**
 * Firebase service for user progress tracking and spaced repetition
 * 
 * Handles CRUD operations for UserStats and CardProgress with proper
 * error handling, validation, and performance optimizations.
 */
export class ProgressService {
  private config: Required<ProgressServiceConfig>;

  constructor(
    private db: Firestore,
    config: ProgressServiceConfig = {}
  ) {
    this.config = {
      maxBatchSize: 500,
      enableVerboseLogging: false,
      ...config,
    };
    
    logger.info('ProgressService initialized', { config: this.config });
  }

  /**
   * Creates a typed reference to the user stats document
   */
  private userStatsRef(userId: string) {
    return doc(this.db, 'users', userId, 'userProgress', 'stats')
      .withConverter(userStatsConverter);
  }

  /**
   * Creates a typed reference to a card progress document
   */
  private cardProgressRef(userId: string, positionId: string) {
    return doc(this.db, 'users', userId, 'userProgress', positionId)
      .withConverter(cardProgressConverter);
  }

  /**
   * Creates a reference to the userProgress subcollection
   */
  private userProgressCollection(userId: string) {
    return collection(this.db, 'users', userId, 'userProgress');
  }

  /**
   * Validates user ID parameter
   */
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
    }
  }

  /**
   * Validates position ID parameter
   */
  private validatePositionId(positionId: string): void {
    if (!positionId || typeof positionId !== 'string' || positionId.trim() === '') {
      throw new Error(ERROR_MESSAGES.INVALID_POSITION_ID);
    }
  }

  /**
   * Wrapper for Firestore operations with standardized error handling
   */
  private async firestoreOp<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      const result = await operation();
      if (this.config.enableVerboseLogging) {
        logger.debug(`${operationName} completed successfully`);
      }
      return result;
    } catch (error) {
      logger.error(`${operationName} failed`, error as Error);
      throw new Error(ERROR_MESSAGES.FIRESTORE_ERROR);
    }
  }

  // ===== CORE CRUD OPERATIONS =====

  /**
   * Retrieves user statistics
   * 
   * @param userId - User identifier
   * @returns UserStats or null if not found
   * 
   * @example
   * ```typescript
   * const stats = await service.getUserStats('user123');
   * if (stats) {
   *   console.log(`Completed: ${stats.totalPositionsCompleted}`);
   * }
   * ```
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    this.validateUserId(userId);
    
    return this.firestoreOp(async () => {
      const docRef = this.userStatsRef(userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserStats;
      }
      
      logger.debug('User stats not found', { userId });
      return null;
    }, 'getUserStats');
  }

  /**
   * Updates user statistics using atomic operations where possible
   * 
   * @param userId - User identifier
   * @param updates - Partial stats to update (supports increment, serverTimestamp, etc.)
   * 
   * @example
   * ```typescript
   * // Atomic increment
   * await service.updateUserStats('user123', {
   *   totalPositionsCompleted: increment(1),
   *   totalTimeSpent: increment(300),
   *   lastActive: Date.now()
   * });
   * ```
   */
  async updateUserStats(
    userId: string, 
    updates: Partial<WithFieldValue<UserStats>>
  ): Promise<void> {
    this.validateUserId(userId);
    
    return this.firestoreOp(async () => {
      const docRef = this.userStatsRef(userId);
      
      // Use setDoc with merge to create document if it doesn't exist
      await setDoc(docRef, {
        userId, // Ensure userId is always set
        ...updates,
      }, { merge: true });
      
      logger.debug('User stats updated', { userId, updateKeys: Object.keys(updates) });
    }, 'updateUserStats');
  }

  /**
   * Retrieves card progress for a specific position
   * 
   * @param userId - User identifier
   * @param positionId - Position identifier
   * @returns CardProgress or null if not found
   */
  async getCardProgress(
    userId: string, 
    positionId: string
  ): Promise<CardProgress | null> {
    this.validateUserId(userId);
    this.validatePositionId(positionId);
    
    return this.firestoreOp(async () => {
      const docRef = this.cardProgressRef(userId, positionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as CardProgress;
      }
      
      return null;
    }, 'getCardProgress');
  }

  /**
   * Creates or updates card progress (upsert operation)
   * 
   * @param userId - User identifier
   * @param positionId - Position identifier  
   * @param progress - Complete CardProgress object
   * 
   * @example
   * ```typescript
   * const updatedCard = updateCardProgress(existingCard, quality, Date.now());
   * await service.upsertCardProgress('user123', 'pos456', updatedCard);
   * ```
   */
  async upsertCardProgress(
    userId: string,
    positionId: string,
    progress: CardProgress
  ): Promise<void> {
    this.validateUserId(userId);
    this.validatePositionId(positionId);
    
    return this.firestoreOp(async () => {
      const docRef = this.cardProgressRef(userId, positionId);
      
      // Ensure the ID matches the position
      const progressWithId = { ...progress, id: positionId };
      
      await setDoc(docRef, progressWithId);
      
      logger.debug('Card progress updated', { 
        userId, 
        positionId, 
        interval: progress.interval,
        nextReview: new Date(progress.nextReviewAt).toISOString()
      });
    }, 'upsertCardProgress');
  }

  /**
   * Deletes card progress for a specific position
   * 
   * @param userId - User identifier
   * @param positionId - Position identifier
   * @returns True if deleted, false if not found
   * 
   * @example
   * ```typescript
   * const deleted = await service.deleteCardProgress('user123', 'pos456');
   * if (deleted) {
   *   console.log('Card progress deleted successfully');
   * }
   * ```
   */
  async deleteCardProgress(
    userId: string,
    positionId: string
  ): Promise<boolean> {
    this.validateUserId(userId);
    this.validatePositionId(positionId);
    
    return this.firestoreOp(async () => {
      const docRef = this.cardProgressRef(userId, positionId);
      
      // Check if document exists before deleting
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        logger.debug('Card progress not found for deletion', { userId, positionId });
        return false;
      }
      
      await deleteDoc(docRef);
      
      logger.debug('Card progress deleted', { userId, positionId });
      return true;
    }, 'deleteCardProgress');
  }

  // ===== BATCH OPERATIONS =====

  /**
   * Bulk updates multiple card progresses in a single batch
   * 
   * @param userId - User identifier
   * @param updates - Array of position ID and progress pairs
   * 
   * @throws Error if batch size exceeds maximum
   * 
   * @example
   * ```typescript
   * await service.bulkUpdateCardProgresses('user123', [
   *   { positionId: 'pos1', progress: card1 },
   *   { positionId: 'pos2', progress: card2 }
   * ]);
   * ```
   */
  async bulkUpdateCardProgresses(
    userId: string,
    updates: Array<{ positionId: string; progress: CardProgress }>
  ): Promise<void> {
    this.validateUserId(userId);
    
    if (updates.length > this.config.maxBatchSize) {
      throw new Error(ERROR_MESSAGES.BATCH_TOO_LARGE);
    }

    // Validate all position IDs before processing
    for (const { positionId } of updates) {
      this.validatePositionId(positionId);
    }

    return this.firestoreOp(async () => {
      const batch = writeBatch(this.db);
      
      for (const { positionId, progress } of updates) {
        const docRef = this.cardProgressRef(userId, positionId);
        const progressWithId = { ...progress, id: positionId };
        batch.set(docRef, progressWithId);
      }
      
      await batch.commit();
      
      logger.info('Bulk card progress update completed', { 
        userId, 
        count: updates.length 
      });
    }, 'bulkUpdateCardProgresses');
  }

  /**
   * Atomic transaction to update both user stats and card progresses
   * 
   * This ensures consistency when updating both user-level statistics
   * and individual card progress in a single training session.
   * 
   * @param userId - User identifier
   * @param statsUpdate - Partial user stats to update
   * @param cardUpdates - Array of card progress updates
   * 
   * @example
   * ```typescript
   * // After completing a training session
   * await service.updateProgressTransaction('user123', 
   *   { 
   *     totalPositionsCompleted: increment(3),
   *     totalTimeSpent: increment(600)  
   *   },
   *   [
   *     { positionId: 'pos1', progress: updatedCard1 },
   *     { positionId: 'pos2', progress: updatedCard2 }
   *   ]
   * );
   * ```
   */
  async updateProgressTransaction(
    userId: string,
    statsUpdate: Partial<WithFieldValue<UserStats>>,
    cardUpdates: Array<{ positionId: string; progress: CardProgress }>
  ): Promise<void> {
    this.validateUserId(userId);
    
    if (cardUpdates.length > this.config.maxBatchSize) {
      throw new Error(ERROR_MESSAGES.BATCH_TOO_LARGE);
    }

    // Validate all position IDs before processing
    for (const { positionId } of cardUpdates) {
      this.validatePositionId(positionId);
    }

    return this.firestoreOp(async () => {
      await runTransaction(this.db, async (transaction: Transaction) => {
        // Update user stats
        const userStatsDocRef = this.userStatsRef(userId);
        transaction.set(userStatsDocRef, {
          userId,
          ...statsUpdate,
        }, { merge: true });

        // Update all card progresses
        for (const { positionId, progress } of cardUpdates) {
          const cardDocRef = this.cardProgressRef(userId, positionId);
          const progressWithId = { ...progress, id: positionId };
          transaction.set(cardDocRef, progressWithId);
        }
      });

      logger.info('Progress transaction completed', {
        userId,
        statsKeys: Object.keys(statsUpdate),
        cardCount: cardUpdates.length,
      });
    }, 'updateProgressTransaction');
  }

  // ===== UTILITY METHODS =====

  /**
   * Retrieves all card progresses for a user
   * 
   * @param userId - User identifier
   * @returns Array of all CardProgress objects
   * 
   * @warning This can be expensive for users with many cards.
   * Consider pagination for large datasets.
   */
  async getAllCardProgresses(userId: string): Promise<CardProgress[]> {
    this.validateUserId(userId);
    
    return this.firestoreOp(async () => {
      const collectionRef = this.userProgressCollection(userId)
        .withConverter(cardProgressConverter);
      
      const snapshot = await getDocs(collectionRef);
      const cardProgresses: CardProgress[] = [];
      
      snapshot.forEach((doc) => {
        // Skip the 'stats' document
        if (doc.id !== 'stats') {
          cardProgresses.push(doc.data() as CardProgress);
        }
      });
      
      logger.debug('Retrieved all card progresses', { 
        userId, 
        count: cardProgresses.length 
      });
      
      return cardProgresses;
    }, 'getAllCardProgresses');
  }

  /**
   * Retrieves cards that are due for review
   * 
   * @param userId - User identifier
   * @param now - Current timestamp (defaults to Date.now())
   * @returns Array of CardProgress objects due for review
   * 
   * @example
   * ```typescript
   * const dueCards = await service.getDueCardProgresses('user123');
   * console.log(`${dueCards.length} cards are due for review`);
   * ```
   */
  async getDueCardProgresses(
    userId: string,
    now: number = Date.now()
  ): Promise<CardProgress[]> {
    this.validateUserId(userId);
    
    return this.firestoreOp(async () => {
      // For now, we fetch all cards and filter client-side
      // In a future optimization, we could use Firestore queries with where('nextReviewAt', '<=', now)
      // but that would require a composite index on (userId, nextReviewAt)
      const allCards = await this.getAllCardProgresses(userId);
      const dueCards = allCards.filter(card => card.nextReviewAt <= now);
      
      logger.debug('Retrieved due card progresses', { 
        userId, 
        totalCards: allCards.length,
        dueCards: dueCards.length 
      });
      
      return dueCards;
    }, 'getDueCardProgresses');
  }

  /**
   * Initializes a new user with default stats
   * 
   * @param userId - User identifier
   * @param initialStats - Optional initial stats (defaults to zeros)
   * 
   * @example
   * ```typescript
   * // Initialize new user after signup
   * await service.initializeUser('user123', {
   *   lastActive: Date.now()
   * });
   * ```
   */
  async initializeUser(
    userId: string,
    initialStats?: Partial<UserStats>
  ): Promise<void> {
    this.validateUserId(userId);
    
    const defaultStats: UserStats = {
      userId,
      totalPositionsCompleted: 0,
      overallSuccessRate: 0,
      totalTimeSpent: 0,
      totalHintsUsed: 0,
      lastActive: Date.now(),
      ...initialStats,
    };

    return this.updateUserStats(userId, defaultStats);
  }

  /**
   * Deletes all progress data for a user
   * 
   * @param userId - User identifier
   * @returns Number of documents deleted
   * 
   * @warning This operation cannot be undone
   */
  async deleteAllUserProgress(userId: string): Promise<number> {
    this.validateUserId(userId);
    
    return this.firestoreOp(async () => {
      const collectionRef = this.userProgressCollection(userId);
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) {
        return 0;
      }

      const batch = writeBatch(this.db);
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      const deletedCount = snapshot.size;
      logger.warn('Deleted all user progress', { userId, count: deletedCount });
      
      return deletedCount;
    }, 'deleteAllUserProgress');
  }
}

// Export factory function for easier testing and dependency injection
export function createProgressService(
  firestore: Firestore,
  config?: ProgressServiceConfig
): ProgressService {
  return new ProgressService(firestore, config);
}