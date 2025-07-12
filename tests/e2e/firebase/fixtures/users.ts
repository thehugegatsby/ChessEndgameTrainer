/**
 * Test User Templates and Fixtures
 * Predefined user data for testing scenarios
 */

export interface TestUserProgress {
  completed: boolean;
  bestScore: number;
  attempts: number;
}

export interface TestUserTemplate {
  email: string;
  displayName: string;
  progress: Record<number, TestUserProgress>;
}

export const TEST_USER_TEMPLATES = {
  BEGINNER: {
    email: 'beginner@test.local',
    displayName: 'Test Beginner',
    progress: {}
  },
  INTERMEDIATE: {
    email: 'intermediate@test.local',
    displayName: 'Test Intermediate',
    progress: {
      1: { completed: true, bestScore: 95, attempts: 2 },
      2: { completed: false, bestScore: 0, attempts: 1 }
    }
  },
  ADVANCED: {
    email: 'advanced@test.local',
    displayName: 'Test Advanced',
    progress: {
      1: { completed: true, bestScore: 100, attempts: 1 },
      2: { completed: true, bestScore: 98, attempts: 1 },
      12: { completed: false, bestScore: 65, attempts: 3 }
    }
  },
  EXPERT: {
    email: 'expert@test.local',
    displayName: 'Test Expert',
    progress: {
      1: { completed: true, bestScore: 100, attempts: 1 },
      2: { completed: true, bestScore: 100, attempts: 1 },
      12: { completed: true, bestScore: 100, attempts: 1 }
    }
  }
} as const;

/**
 * Authentication test data (safe for testing only)
 */
export const TEST_AUTH_DATA = {
  DEFAULT_PASSWORD: 'TestPassword123!',
  WEAK_PASSWORD: '123',
  INVALID_EMAIL: 'not-an-email',
  VALID_DOMAINS: ['test.local'],
  CUSTOM_CLAIMS: {
    ADMIN: { role: 'admin', permissions: ['read', 'write', 'delete'] },
    USER: { role: 'user', permissions: ['read'] },
    MODERATOR: { role: 'moderator', permissions: ['read', 'write'] }
  }
} as const;

export type TestUserTemplateKey = keyof typeof TEST_USER_TEMPLATES;
export type TestUserCustomClaim = keyof typeof TEST_AUTH_DATA.CUSTOM_CLAIMS;