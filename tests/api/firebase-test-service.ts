/**
 * Firebase Test Service
 * Business logic layer for Firebase test operations
 * Separated from HTTP concerns for better testability
 */

import { 
  SCENARIO_DEFINITIONS, 
  TEST_USER_TEMPLATES,
  generateTestUserEmail,
  generateTestId,
  type ScenarioName,
  type TestUserTemplateKey
} from '../e2e/firebase';
import { 
  clearFirestoreData,
  seedTestPositions,
  seedTestCategories,
  seedTestChapters,
  initializeTestFirebase,
  waitForFirestore
} from '../utils/firebase-test-helpers';
import { 
  type Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  FirebaseBatchSeeder,
  type BatchSeedResult,
  type BatchProgress,
  type AdvancedSeedOptions
} from './firebase-batch-seeder';

export interface CreateUserOptions {
  template?: TestUserTemplateKey;
  overrides?: {
    email?: string;
    displayName?: string;
    customClaims?: Record<string, any>;
  };
}

export interface SeedScenarioOptions {
  userCount?: number;
  includeProgress?: boolean;
}

export interface BatchSeedData {
  positions?: any[];
  categories?: any[];
  chapters?: any[];
  users?: CreateUserOptions[];
}

export interface EnhancedBatchOptions extends AdvancedSeedOptions {
  includeUsers?: boolean;
  userOptions?: {
    templates?: TestUserTemplateKey[];
    customClaims?: Record<string, any>;
  };
}

export interface FirebaseIntegrityResult {
  integrity: 'good' | 'issues_found';
  counts: Record<string, number>;
  issues: string[];
}

export interface FirebaseStatusResult {
  status: 'connected' | 'disconnected';
  collections: Record<string, number>;
}

/**
 * Firebase Test Service
 * Encapsulates Firebase business logic separate from HTTP layer
 */
export class FirebaseTestService {
  private static readonly BATCH_SIZE_LIMIT = 500; // Firestore batch limit
  private static readonly MAX_CONCURRENT_OPERATIONS = 10;

  /**
   * Initialize Firebase test environment
   */
  static async setup(): Promise<void> {
    await initializeTestFirebase();
    await waitForFirestore();
  }

  /**
   * Clear all Firestore data
   */
  static async clearAll(): Promise<void> {
    await clearFirestoreData();
  }

  /**
   * Create test user based on template with validation
   */
  static async createUser(options: CreateUserOptions = {}): Promise<{
    user: any;
    progressEntries: number;
  }> {
    const { template = 'BEGINNER', overrides = {} } = options;
    
    // Validate template
    if (!(template in TEST_USER_TEMPLATES)) {
      throw new Error(`Invalid user template: ${template}. Valid templates: ${Object.keys(TEST_USER_TEMPLATES).join(', ')}`);
    }
    
    const baseTemplate = TEST_USER_TEMPLATES[template];
    
    // Generate unique, validated email
    const email = overrides.email || generateTestUserEmail(template.toLowerCase());
    if (!this.isValidTestEmail(email)) {
      throw new Error(`Invalid test email format: ${email}`);
    }
    
    // Create user data with proper typing
    const userData = {
      ...baseTemplate,
      email,
      displayName: overrides.displayName || baseTemplate.displayName,
      uid: generateTestId('user'),
      createdAt: new Date().toISOString(),
      isTestUser: true,
      template,
      customClaims: overrides.customClaims || {}
    };
    
    try {
      // Store user in Firestore
      const db = await initializeTestFirebase();
      await setDoc(doc(db, 'users', userData.uid), userData);
      
      // Store progress data if it exists
      const progressEntries = await this.createUserProgress(db, userData.uid, baseTemplate.progress);
      
      return {
        user: userData,
        progressEntries
      };
    } catch (error) {
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Seed test scenario with validation and error handling
   */
  static async seedScenario(
    scenario: ScenarioName, 
    options: SeedScenarioOptions = {}
  ): Promise<{
    scenario: string;
    seeded: Record<string, number>;
    users: any[];
  }> {
    // Validate scenario
    if (!(scenario in SCENARIO_DEFINITIONS)) {
      throw new Error(`Invalid scenario: ${scenario}. Valid scenarios: ${Object.keys(SCENARIO_DEFINITIONS).join(', ')}`);
    }
    
    const scenarioData = SCENARIO_DEFINITIONS[scenario];
    
    try {
      // Clear existing data first
      await this.clearAll();
      
      // Seed core data
      const seeded = {
        positions: 0,
        categories: 0,
        chapters: 0,
        users: 0
      };
      
      if (scenarioData.positions.length > 0) {
        await seedTestPositions(scenarioData.positions);
        seeded.positions = scenarioData.positions.length;
      }
      
      if (scenarioData.categories.length > 0) {
        await seedTestCategories(scenarioData.categories);
        seeded.categories = scenarioData.categories.length;
      }
      
      if (scenarioData.chapters.length > 0) {
        await seedTestChapters(scenarioData.chapters);
        seeded.chapters = scenarioData.chapters.length;
      }
      
      // Create test users
      const userCount = options.userCount || scenarioData.userCount;
      const createdUsers = await this.createScenarioUsers(scenario, userCount);
      seeded.users = createdUsers.length;
      
      return {
        scenario: scenarioData.name,
        seeded,
        users: createdUsers
      };
    } catch (error) {
      throw new Error(`Failed to seed scenario '${scenario}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch seed custom data with proper validation (legacy method)
   */
  static async seedBatch(data: BatchSeedData): Promise<Record<string, number>> {
    const { positions = [], categories = [], chapters = [], users = [] } = data;
    
    const results = {
      positions: 0,
      categories: 0,
      chapters: 0,
      users: 0
    };
    
    try {
      // Validate batch sizes
      if (positions.length > this.BATCH_SIZE_LIMIT) {
        throw new Error(`Too many positions: ${positions.length}. Maximum: ${this.BATCH_SIZE_LIMIT}`);
      }
      
      // Seed data sequentially to avoid overwhelming the emulator
      if (positions.length > 0) {
        await seedTestPositions(positions);
        results.positions = positions.length;
      }
      
      if (categories.length > 0) {
        await seedTestCategories(categories);
        results.categories = categories.length;
      }
      
      if (chapters.length > 0) {
        await seedTestChapters(chapters);
        results.chapters = chapters.length;
      }
      
      // Create users with controlled concurrency
      if (users.length > 0) {
        const userResults = await this.createBatchUsers(users);
        results.users = userResults.length;
      }
      
      return results;
    } catch (error) {
      throw new Error(`Batch seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhanced batch seeding with comprehensive validation, progress tracking, and advanced options
   */
  static async seedBatchAdvanced(
    data: BatchSeedData,
    options: EnhancedBatchOptions = {}
  ): Promise<BatchSeedResult> {
    const { positions = [], categories = [], chapters = [], users = [] } = data;
    const {
      includeUsers = true,
      userOptions = {},
      validateData = true,
      clearExisting = false,
      onProgress,
      enableRetries = true,
      parallelism = 5,
      transactional = false
    } = options;

    try {
      // Initialize batch seeder
      const seeder = new FirebaseBatchSeeder();
      
      // Seed core data (positions, categories, chapters)
      const coreResult = await seeder.seedBatchAdvanced(
        { positions, categories, chapters },
        {
          validateData,
          clearExisting,
          onProgress: (progress) => {
            // Adjust progress for user creation phase
            const adjustedProgress = {
              ...progress,
              total: progress.total + (includeUsers ? users.length : 0)
            };
            if (onProgress) onProgress(adjustedProgress);
          },
          enableRetries,
          parallelism,
          transactional
        }
      );

      // Create users if requested
      let userResults: any[] = [];
      if (includeUsers && users.length > 0) {
        try {
          userResults = await this.createBatchUsersAdvanced(users, userOptions, onProgress);
          coreResult.results.users = userResults.length;
        } catch (error) {
          coreResult.errors.push({
            operation: 'user_creation',
            error: error instanceof Error ? error.message : 'User creation failed'
          });
          coreResult.success = false;
        }
      }

      return {
        ...coreResult,
        results: {
          ...coreResult.results,
          users: userResults.length
        }
      };

    } catch (error) {
      return {
        success: false,
        results: { positions: 0, categories: 0, chapters: 0, users: 0 },
        errors: [{
          operation: 'batch_seed_advanced',
          error: error instanceof Error ? error.message : 'Unknown error'
        }],
        duration: 0,
        progress: {
          total: positions.length + categories.length + chapters.length + users.length,
          completed: 0,
          failed: 0,
          percentage: 0,
          estimatedTimeRemaining: 0,
          currentOperation: 'Failed to initialize'
        }
      };
    }
  }

  /**
   * Advanced scenario seeding with enhanced options
   */
  static async seedScenarioAdvanced(
    scenario: ScenarioName,
    options: EnhancedBatchOptions & SeedScenarioOptions = {}
  ): Promise<BatchSeedResult> {
    // Validate scenario
    if (!(scenario in SCENARIO_DEFINITIONS)) {
      throw new Error(`Invalid scenario: ${scenario}. Valid scenarios: ${Object.keys(SCENARIO_DEFINITIONS).join(', ')}`);
    }

    const scenarioData = SCENARIO_DEFINITIONS[scenario];
    const { userCount = scenarioData.userCount, includeProgress = false } = options;

    // Create user options based on scenario
    const userTemplates: TestUserTemplateKey[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
    const users: CreateUserOptions[] = Array.from({ length: userCount }, (_, i) => ({
      template: userTemplates[i % userTemplates.length],
      overrides: {
        email: generateTestUserEmail(`${scenario}-${userTemplates[i % userTemplates.length].toLowerCase()}`)
      }
    }));

    // Enhanced batch seeding
    return this.seedBatchAdvanced({
      positions: scenarioData.positions,
      categories: scenarioData.categories,
      chapters: scenarioData.chapters,
      users
    }, {
      ...options,
      includeUsers: userCount > 0,
      userOptions: {
        templates: userTemplates,
        customClaims: { scenario }
      }
    });
  }

  /**
   * Create batch users with advanced options and progress tracking
   */
  private static async createBatchUsersAdvanced(
    userRequests: CreateUserOptions[],
    userOptions: { templates?: TestUserTemplateKey[]; customClaims?: Record<string, any> } = {},
    onProgress?: (progress: BatchProgress) => void
  ): Promise<any[]> {
    const results: any[] = [];
    const total = userRequests.length;
    
    for (let i = 0; i < userRequests.length; i += this.MAX_CONCURRENT_OPERATIONS) {
      const batch = userRequests.slice(i, i + this.MAX_CONCURRENT_OPERATIONS);
      
      // Update progress
      if (onProgress) {
        onProgress({
          total,
          completed: i,
          failed: 0,
          percentage: Math.round(i / total * 100),
          estimatedTimeRemaining: 0,
          currentOperation: `Creating users ${i + 1}-${Math.min(i + batch.length, total)}`
        });
      }
      
      const batchPromises = batch.map(userRequest => {
        const enhancedRequest = {
          ...userRequest,
          overrides: {
            ...userRequest.overrides,
            customClaims: {
              ...userRequest.overrides?.customClaims,
              ...userOptions.customClaims
            }
          }
        };
        return this.createUser(enhancedRequest);
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value.user);
        } else {
          console.warn(`Failed to create user ${i + index}:`, result.reason);
        }
      });
    }
    
    // Final progress update
    if (onProgress) {
      onProgress({
        total,
        completed: results.length,
        failed: total - results.length,
        percentage: 100,
        estimatedTimeRemaining: 0,
        currentOperation: `Completed: ${results.length}/${total} users created`
      });
    }
    
    return results;
  }

  /**
   * Get comprehensive seeding statistics
   */
  static async getSeedingStatistics(): Promise<{
    collections: Record<string, number>;
    totalDocuments: number;
    lastSeeded: Date | null;
    performance: {
      averageDocumentsPerSecond: number;
      estimatedSeedingTime: number;
    };
  }> {
    const seeder = new FirebaseBatchSeeder();
    const stats = await seeder.getSeedingStats();
    
    // Calculate performance metrics
    const performance = {
      averageDocumentsPerSecond: stats.lastSeeded 
        ? stats.totalDocuments / ((Date.now() - stats.lastSeeded.getTime()) / 1000)
        : 0,
      estimatedSeedingTime: stats.totalDocuments * 0.1 // Rough estimate: 0.1s per document
    };
    
    return {
      ...stats,
      performance
    };
  }

  /**
   * Get Firebase emulator status with comprehensive checks
   */
  static async getStatus(): Promise<FirebaseStatusResult> {
    try {
      const db = await initializeTestFirebase();
      
      // Test basic connectivity with timeout
      const connectivityPromise = getDocs(collection(db, '_test'));
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      await Promise.race([connectivityPromise, timeoutPromise]);
      
      // Count documents in main collections
      const [positionsSnapshot, categoriesSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, 'positions')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'users'))
      ]);
      
      return {
        status: 'connected',
        collections: {
          positions: positionsSnapshot.size,
          categories: categoriesSnapshot.size,
          users: usersSnapshot.size
        }
      };
    } catch (error) {
      return {
        status: 'disconnected',
        collections: {}
      };
    }
  }

  /**
   * Verify data integrity with comprehensive checks
   */
  static async verifyIntegrity(): Promise<FirebaseIntegrityResult> {
    try {
      const db = await initializeTestFirebase();
      
      const [positionsSnapshot, categoriesSnapshot, chaptersSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, 'positions')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'chapters')),
        getDocs(collection(db, 'users'))
      ]);
      
      const issues: string[] = [];
      
      // Check for orphaned data
      const positions = positionsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      const categories = categoriesSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
      positions.forEach((position: any) => {
        if (!categories.some((cat: any) => cat.id === position.category)) {
          issues.push(`Position ${position.id} references non-existent category: ${position.category}`);
        }
      });
      
      // Check for test users without proper flags
      const users = usersSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      users.forEach((user: any) => {
        if (!user.isTestUser && user.email && user.email.includes('test.local')) {
          issues.push(`User ${user.id} appears to be test user but missing isTestUser flag`);
        }
        
        // Check for invalid email formats
        if (user.email && !this.isValidTestEmail(user.email) && user.isTestUser) {
          issues.push(`Test user ${user.id} has invalid test email format: ${user.email}`);
        }
      });
      
      // Check for duplicate emails
      const emails = users.map((u: any) => u.email).filter(Boolean);
      const duplicates = emails.filter((email: any, index: number) => emails.indexOf(email) !== index);
      duplicates.forEach((email: any) => {
        issues.push(`Duplicate email found: ${email}`);
      });
      
      return {
        integrity: issues.length === 0 ? 'good' : 'issues_found',
        counts: {
          positions: positionsSnapshot.size,
          categories: categoriesSnapshot.size,
          chapters: chaptersSnapshot.size,
          users: usersSnapshot.size
        },
        issues
      };
    } catch (error) {
      throw new Error(`Integrity verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private static async createUserProgress(db: Firestore, userId: string, progress: Record<string, any>): Promise<number> {
    if (!progress || Object.keys(progress).length === 0) {
      return 0;
    }
    
    const batch = writeBatch(db);
    let count = 0;
    
    Object.entries(progress).forEach(([positionId, progressData]) => {
      const progressDoc = doc(db, 'user-progress', `${userId}-${positionId}`);
      batch.set(progressDoc, {
        userId,
        positionId: parseInt(positionId),
        ...progressData,
        updatedAt: new Date().toISOString()
      });
      count++;
    });
    
    await batch.commit();
    return count;
  }

  private static async createScenarioUsers(scenario: string, userCount: number): Promise<any[]> {
    if (userCount <= 0) return [];
    
    const userTemplates = Object.keys(TEST_USER_TEMPLATES) as TestUserTemplateKey[];
    const createdUsers = [];
    const db = await initializeTestFirebase();
    
    for (let i = 0; i < userCount; i++) {
      const template = userTemplates[i % userTemplates.length];
      const userData = {
        ...TEST_USER_TEMPLATES[template],
        email: generateTestUserEmail(`${scenario}-${template.toLowerCase()}`),
        uid: generateTestId(`${scenario}-user`),
        createdAt: new Date().toISOString(),
        isTestUser: true,
        scenario,
        template
      };
      
      await setDoc(doc(db, 'users', userData.uid), userData);
      createdUsers.push(userData);
    }
    
    return createdUsers;
  }

  private static async createBatchUsers(userRequests: CreateUserOptions[]): Promise<any[]> {
    const results = [];
    
    // Process in batches to avoid overwhelming the emulator
    for (let i = 0; i < userRequests.length; i += this.MAX_CONCURRENT_OPERATIONS) {
      const batch = userRequests.slice(i, i + this.MAX_CONCURRENT_OPERATIONS);
      const batchPromises = batch.map(userRequest => this.createUser(userRequest));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.map(r => r.user));
    }
    
    return results;
  }

  private static isValidTestEmail(email: string): boolean {
    const testEmailPattern = /^[a-zA-Z0-9._-]+@test\.local$/;
    return testEmailPattern.test(email);
  }
}