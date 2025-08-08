/**
 * Position Repository Interface
 * Defines the contract for position data access
 * Completely decoupled from any specific implementation (Firebase, API, etc.)
 */

import {
  EndgamePosition,
  EndgameCategory,
  EndgameChapter,
} from "@shared/types";

/**
 * Repository interface for position data access
 * This abstraction allows for multiple implementations:
 * - FirebasePositionRepository (production)
 * - MockPositionRepository (testing)
 * - LocalStoragePositionRepository (offline)
 * - APIPositionRepository (future migration)
 */
export interface IPositionRepository {
  // Single position operations
  getPosition(id: number): Promise<EndgamePosition | null>;
  createPosition(
    position: Omit<EndgamePosition, "id">,
  ): Promise<EndgamePosition>;
  updatePosition(
    id: number,
    updates: Partial<EndgamePosition>,
  ): Promise<EndgamePosition | null>;
  deletePosition(id: number): Promise<boolean>;

  // Bulk position operations
  getAllPositions(): Promise<EndgamePosition[]>;
  getPositionsByCategory(category: string): Promise<EndgamePosition[]>;
  getPositionsByDifficulty(
    difficulty: EndgamePosition["difficulty"],
  ): Promise<EndgamePosition[]>;
  getPositionsByIds(ids: number[]): Promise<EndgamePosition[]>;

  // Search and filtering
  searchPositions(searchTerm: string): Promise<EndgamePosition[]>;
  getPositionsByTags(tags: string[]): Promise<EndgamePosition[]>;

  // Navigation
  getNextPosition(
    currentId: number,
    categoryId?: string,
  ): Promise<EndgamePosition | null>;
  getPreviousPosition(
    currentId: number,
    categoryId?: string,
  ): Promise<EndgamePosition | null>;

  // Categories and chapters
  getCategories(): Promise<EndgameCategory[]>;
  getCategory(id: string): Promise<EndgameCategory | null>;
  getChapters(): Promise<EndgameChapter[]>;
  getChaptersByCategory(categoryId: string): Promise<EndgameChapter[]>;

  // Statistics
  getTotalPositionCount(): Promise<number>;
  getPositionCountByCategory(categoryId: string): Promise<number>;
  getPositionCountByDifficulty(
    difficulty: EndgamePosition["difficulty"],
  ): Promise<number>;

  // Batch operations
  batchCreatePositions(
    positions: Omit<EndgamePosition, "id">[],
  ): Promise<EndgamePosition[]>;
  batchUpdatePositions(
    updates: Array<{ id: number; updates: Partial<EndgamePosition> }>,
  ): Promise<EndgamePosition[]>;
  batchDeletePositions(ids: number[]): Promise<boolean>;
}

/**
 * Repository events for observability
 */
export interface IPositionRepositoryEvents {
  onDataFetched?: (operation: string, count: number) => void;
  onDataModified?: (operation: string, ids: number[]) => void;
  onError?: (operation: string, error: Error) => void;
}

/**
 * Repository configuration
 */
export interface IPositionRepositoryConfig {
  enableCache?: boolean;
  cacheSize?: number;
  cacheTTL?: number;
  enableOfflineSupport?: boolean;
  events?: IPositionRepositoryEvents;
}
