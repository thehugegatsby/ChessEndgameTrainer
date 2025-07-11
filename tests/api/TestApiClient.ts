/**
 * Test API Client
 * Type-safe client for test API server interactions
 */

import { APIRequestContext } from '@playwright/test';
import { EndgamePosition } from '@shared/types/endgame';

export interface TestUser {
  userId: string;
  email?: string;
  displayName?: string;
  progress?: Record<number, {
    completed: boolean;
    bestScore: number;
    attempts: number;
  }>;
}

export interface GameState {
  positionId: number;
  fen: string;
  moveHistory: string[];
  lastUpdated?: Date;
}

export interface MoveRequest {
  positionId: number;
  move: string;
  userId?: string;
}

export interface AnalysisResult {
  fen: string;
  evaluation: number;
  bestMove: string;
  depth: number;
  nodes: number;
}

export interface DataIntegrity {
  positionsCount: number;
  categoriesCount: number;
  chaptersCount: number;
  issues: string[];
}

export class TestApiClient {
  private readonly baseUrl: string;
  private readonly request: APIRequestContext;

  constructor(request: APIRequestContext, baseUrl = 'http://localhost:3003') {
    this.request = request;
    this.baseUrl = baseUrl;
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; environment: string }> {
    const response = await this.request.get(`${this.baseUrl}/health`);
    
    if (!response.ok()) {
      throw new Error(`Health check failed: ${response.status()}`);
    }
    
    return response.json();
  }

  /**
   * Create test user with optional progress
   */
  async createTestUser(user: TestUser): Promise<{ success: boolean; userId: string }> {
    const response = await this.request.post(`${this.baseUrl}/e2e/create-test-user`, {
      data: user
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to create test user: ${error}`);
    }

    return response.json();
  }

  /**
   * Make a move in the game
   */
  async makeMove(move: MoveRequest): Promise<{ success: boolean; move: string }> {
    const response = await this.request.post(`${this.baseUrl}/e2e/make-move`, {
      data: move
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to make move: ${error}`);
    }

    return response.json();
  }

  /**
   * Set game state directly
   */
  async setGameState(state: GameState): Promise<{ success: boolean }> {
    const response = await this.request.post(`${this.baseUrl}/e2e/set-game-state`, {
      data: state
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to set game state: ${error}`);
    }

    return response.json();
  }

  /**
   * Get current game state
   */
  async getGameState(positionId: number): Promise<GameState> {
    const response = await this.request.get(`${this.baseUrl}/e2e/game-state/${positionId}`);

    if (!response.ok()) {
      throw new Error(`Failed to get game state: ${response.status()}`);
    }

    return response.json();
  }

  /**
   * Seed test scenario
   */
  async seedScenario(scenario: 'basic' | 'advanced' | 'empty'): Promise<{ success: boolean; scenario: string }> {
    const response = await this.request.post(`${this.baseUrl}/e2e/seed-scenario`, {
      data: { scenario }
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to seed scenario: ${error}`);
    }

    return response.json();
  }

  /**
   * Clear all test data
   */
  async clearAll(): Promise<{ success: boolean }> {
    const response = await this.request.post(`${this.baseUrl}/e2e/clear-all`);

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to clear data: ${error}`);
    }

    return response.json();
  }

  /**
   * Analyze position
   */
  async analyzePosition(fen: string, depth = 20): Promise<AnalysisResult> {
    const response = await this.request.post(`${this.baseUrl}/e2e/analyze-position`, {
      data: { fen, depth }
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to analyze position: ${error}`);
    }

    return response.json();
  }

  /**
   * Verify data integrity
   */
  async verifyIntegrity(): Promise<DataIntegrity> {
    const response = await this.request.get(`${this.baseUrl}/e2e/verify-integrity`);

    if (!response.ok()) {
      throw new Error(`Failed to verify integrity: ${response.status()}`);
    }

    return response.json();
  }

  /**
   * Batch operations for efficiency
   */
  async batchCreateUsers(users: TestUser[]): Promise<{ success: boolean; userIds: string[] }> {
    const results = await Promise.all(
      users.map(user => this.createTestUser(user))
    );

    return {
      success: results.every(r => r.success),
      userIds: results.map(r => r.userId)
    };
  }

  /**
   * Set up complete test environment
   */
  async setupTestEnvironment(options: {
    scenario: 'basic' | 'advanced' | 'empty';
    users?: TestUser[];
  }): Promise<void> {
    // Clear existing data
    await this.clearAll();
    
    // Seed scenario
    await this.seedScenario(options.scenario);
    
    // Create users if provided
    if (options.users && options.users.length > 0) {
      await this.batchCreateUsers(options.users);
    }
    
    // Verify setup
    const integrity = await this.verifyIntegrity();
    if (integrity.issues.length > 0) {
      throw new Error(`Test environment setup failed: ${integrity.issues.join(', ')}`);
    }
  }

  /**
   * Wait for API to be ready
   */
  async waitForReady(maxAttempts = 10, delayMs = 1000): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await this.health();
        return;
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw new Error('Test API did not become ready in time');
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Firebase-specific methods
   */
  
  /**
   * Setup Firebase test environment
   */
  async setupFirebase(): Promise<{ success: boolean }> {
    const response = await this.request.post(`${this.baseUrl}/e2e/firebase/setup`);
    
    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to setup Firebase: ${error}`);
    }
    
    return response.json();
  }

  /**
   * Clear Firestore data
   */
  async clearFirestore(): Promise<{ success: boolean }> {
    const response = await this.request.post(`${this.baseUrl}/e2e/firebase/clear`);
    
    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to clear Firestore: ${error}`);
    }
    
    return response.json();
  }

  /**
   * Seed test positions
   */
  async seedPositions(positions: EndgamePosition[]): Promise<{ success: boolean }> {
    const response = await this.request.post(`${this.baseUrl}/e2e/firebase/seed-positions`, {
      data: { positions }
    });
    
    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to seed positions: ${error}`);
    }
    
    return response.json();
  }

  /**
   * Seed all test data
   */
  async seedAllTestData(): Promise<{ success: boolean }> {
    const response = await this.request.post(`${this.baseUrl}/e2e/firebase/seed-all`);
    
    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to seed all test data: ${error}`);
    }
    
    return response.json();
  }

  /**
   * Create Firebase test user
   */
  async createUser(email: string, password: string): Promise<{ success: boolean; user: any }> {
    const response = await this.request.post(`${this.baseUrl}/e2e/firebase/create-user`, {
      data: { email, password }
    });
    
    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to create user: ${error}`);
    }
    
    return response.json();
  }
}