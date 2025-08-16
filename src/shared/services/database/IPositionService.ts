/**
 * Position Service Interface
 * Defines the contract for position business logic
 * Allows for multiple service implementations and better testability
 */

import { type EndgamePosition, type EndgameCategory, type EndgameChapter } from '@shared/types';

/**
 * Service interface for position-related business logic
 * This abstraction allows for:
 * - Better testability with mock implementations
 * - Loose coupling between components and service
 * - Easy swapping of service implementations
 * - Clear API contract documentation
 */
export interface PositionService {
  // Single position operations
  getPosition(id: number): Promise<EndgamePosition | null>;
  createPosition(position: Omit<EndgamePosition, 'id'>): Promise<EndgamePosition | null>;
  updatePosition(id: number, updates: Partial<EndgamePosition>): Promise<EndgamePosition | null>;
  deletePosition(id: number): Promise<boolean>;

  // Bulk position operations
  getAllPositions(): Promise<EndgamePosition[]>;
  getPositionsByCategory(category: string): Promise<EndgamePosition[]>;
  getPositionsByDifficulty(difficulty: EndgamePosition['difficulty']): Promise<EndgamePosition[]>;

  // Search and filtering
  searchPositions(searchTerm: string): Promise<EndgamePosition[]>;

  // Navigation
  getNextPosition(currentId: number, categoryId?: string): Promise<EndgamePosition | null>;
  getPreviousPosition(currentId: number, categoryId?: string): Promise<EndgamePosition | null>;

  // Categories and chapters
  getCategories(): Promise<EndgameCategory[]>;
  getChapters(): Promise<EndgameChapter[]>;
  getChaptersByCategory(categoryId: string): Promise<EndgameChapter[]>;

  // Statistics
  getTotalPositionCount(): Promise<number>;
  getPositionCountByCategory(categoryId: string): Promise<number>;

  // Cache management
  clearCache(): void;
  getCacheStats(): { size: number; keys: number[]; enabled: boolean };
}

/**
 * Service configuration options
 */
export interface PositionServiceConfig {
  cacheEnabled?: boolean;
  cacheSize?: number;
  cacheTTL?: number;
}
