/**
 * Firebase Admin SDK Test Helpers
 * Clean architecture using Admin SDK for complete control over test data
 */

import { initializeApp, cert, App, deleteApp } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import { EndgamePosition, EndgameCategory, EndgameChapter } from '@shared/types/endgame';
import * as fs from 'fs/promises';
import * as path from 'path';

export class FirebaseTestAdmin {
  private app: App | null = null;
  private db: Firestore | null = null;

  /**
   * Initialize Admin SDK for tests
   * Uses emulator when FIRESTORE_EMULATOR_HOST is set
   */
  async initialize(): Promise<void> {
    if (this.app) return;

    // Initialize with test project ID
    this.app = initializeApp({
      projectId: 'endgame-trainer-test',
    }, 'test-admin-app');

    this.db = getFirestore(this.app);
    
    // Use emulator if available
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      this.db.settings({
        host: process.env.FIRESTORE_EMULATOR_HOST,
        ssl: false,
      });
    }
  }

  /**
   * Get Firestore instance
   */
  getDb(): Firestore {
    if (!this.db) {
      throw new Error('Firebase Admin not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Clear all collections efficiently
   */
  async clearAllData(): Promise<void> {
    const db = this.getDb();
    const collections = ['positions', 'categories', 'chapters', 'users', 'progress'];

    // Use batched deletes for efficiency
    const deletePromises = collections.map(async (collectionName) => {
      const collection = db.collection(collectionName);
      const batchSize = 500;
      
      const query = collection.orderBy('__name__').limit(batchSize);
      
      return new Promise((resolve, reject) => {
        this.deleteQueryBatch(db, query, resolve).catch(reject);
      });
    });

    await Promise.all(deletePromises);
  }

  /**
   * Recursive batch delete
   */
  private async deleteQueryBatch(
    db: Firestore,
    query: FirebaseFirestore.Query,
    resolve: (value?: unknown) => void
  ): Promise<void> {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Recurse on the next batch
    process.nextTick(() => {
      this.deleteQueryBatch(db, query, resolve);
    });
  }

  /**
   * Load fixture data from JSON files
   */
  async loadFixture<T = any>(fixtureName: string): Promise<T> {
    const fixturePath = path.join(__dirname, '..', 'fixtures', `${fixtureName}.json`);
    const data = await fs.readFile(fixturePath, 'utf-8');
    return JSON.parse(data) as T;
  }

  /**
   * Seed positions from fixture
   */
  async seedPositions(positions?: EndgamePosition[]): Promise<void> {
    const db = this.getDb();
    const batch = db.batch();

    // Load from fixture if not provided
    const positionsToSeed = positions ?? (await this.loadFixture<{ positions: EndgamePosition[] }>('positions')).positions ?? [];

    positionsToSeed.forEach((position) => {
      const docRef = db.collection('positions').doc(position.id.toString());
      batch.set(docRef, {
        ...position,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
  }

  /**
   * Seed categories from fixture
   */
  async seedCategories(categories?: EndgameCategory[]): Promise<void> {
    const db = this.getDb();
    const batch = db.batch();

    // Load from fixture if not provided
    const categoriesToSeed = categories ?? (await this.loadFixture<{ categories: EndgameCategory[] }>('categories')).categories ?? [];

    categoriesToSeed.forEach((category) => {
      const docRef = db.collection('categories').doc(category.id);
      batch.set(docRef, {
        ...category,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
  }

  /**
   * Seed chapters from fixture
   */
  async seedChapters(chapters?: EndgameChapter[]): Promise<void> {
    const db = this.getDb();
    const batch = db.batch();

    // Load from fixture if not provided
    const chaptersToSeed = chapters ?? (await this.loadFixture<{ chapters: EndgameChapter[] }>('chapters')).chapters ?? [];

    chaptersToSeed.forEach((chapter) => {
      const docRef = db.collection('chapters').doc(chapter.id);
      batch.set(docRef, {
        ...chapter,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
  }

  /**
   * Seed all test data at once
   */
  async seedAllTestData(): Promise<void> {
    await Promise.all([
      this.seedPositions(),
      this.seedCategories(),
      this.seedChapters(),
    ]);
  }

  /**
   * Create a specific test scenario
   */
  async createTestScenario(scenario: 'basic' | 'advanced' | 'empty'): Promise<void> {
    await this.clearAllData();

    switch (scenario) {
      case 'basic':
        // Only seed basic positions and categories
        const basicPositions = await this.loadFixture('positions');
        await this.seedPositions(basicPositions.positions.slice(0, 2));
        const basicCategories = await this.loadFixture('categories');
        await this.seedCategories(basicCategories.categories.slice(0, 1));
        break;

      case 'advanced':
        // Seed all data
        await this.seedAllTestData();
        break;

      case 'empty':
        // No data seeded
        break;
    }
  }

  /**
   * Verify data integrity
   */
  async verifyDataIntegrity(): Promise<{
    positionsCount: number;
    categoriesCount: number;
    chaptersCount: number;
    issues: string[];
  }> {
    const db = this.getDb();
    const issues: string[] = [];

    // Count documents
    const [positionsSnapshot, categoriesSnapshot, chaptersSnapshot] = await Promise.all([
      db.collection('positions').get(),
      db.collection('categories').get(),
      db.collection('chapters').get(),
    ]);

    // Check for orphaned chapters
    const categoryIds = new Set(categoriesSnapshot.docs.map(doc => doc.id));
    chaptersSnapshot.docs.forEach(doc => {
      const chapter = doc.data() as EndgameChapter;
      if (!categoryIds.has(chapter.category)) {
        issues.push(`Chapter ${doc.id} references non-existent category ${chapter.category}`);
      }
    });

    // Check for positions with invalid categories
    const positionsWithIssues = positionsSnapshot.docs.filter(doc => {
      const position = doc.data() as EndgamePosition;
      return !categoryIds.has(position.category);
    });

    if (positionsWithIssues.length > 0) {
      issues.push(`${positionsWithIssues.length} positions reference non-existent categories`);
    }

    return {
      positionsCount: positionsSnapshot.size,
      categoriesCount: categoriesSnapshot.size,
      chaptersCount: chaptersSnapshot.size,
      issues,
    };
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.app) {
      await deleteApp(this.app);
      this.app = null;
      this.db = null;
    }
  }
}

// Export singleton instance
export const testAdmin = new FirebaseTestAdmin();