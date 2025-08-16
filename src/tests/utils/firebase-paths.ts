/**
 * Firebase Path Abstraction Layer
 * Centralized path management for Firebase collections
 * Prevents inline path construction and ensures consistency
 */

/**
 * Get the base user document path
 */
export const getUserPath = (userId: string): string => `users/${userId}`;

/**
 * Get the user progress subcollection path
 */
export const getUserProgressPath = (userId: string): string =>
  `${getUserPath(userId)}/userProgress`;

/**
 * Get the user stats document path
 */
export const getUserStatsPath = (userId: string): string => `${getUserProgressPath(userId)}/stats`;

/**
 * Get a specific card progress document path
 */
export const getCardProgressPath = (userId: string, cardId: string): string =>
  `${getUserProgressPath(userId)}/${cardId}`;

/**
 * Collection names as constants
 */
export const COLLECTIONS = {
  USERS: 'users',
  POSITIONS: 'positions',
  CATEGORIES: 'categories',
  CHAPTERS: 'chapters',
} as const;

/**
 * Subcollection names
 */
export const SUBCOLLECTIONS = {
  USER_PROGRESS: 'userProgress',
} as const;

/**
 * Document names
 */
export const DOCUMENTS = {
  STATS: 'stats',
} as const;
