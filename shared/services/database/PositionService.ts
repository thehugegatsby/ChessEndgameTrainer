/**
 * @file Position service implementation
 * @module services/database/PositionService
 *
 * @description
 * Business logic layer for managing chess endgame positions.
 * Handles position-related operations with caching and business rules,
 * completely decoupled from data access implementation through repository pattern.
 *
 * @remarks
 * Key features:
 * - Repository pattern for data abstraction
 * - LRU caching for performance optimization
 * - Comprehensive error handling with logging
 * - Support for CRUD operations
 * - Category and difficulty filtering
 * - Position navigation (next/previous)
 * - Full-text search capabilities
 *
 * The service acts as an intermediary between the UI layer and data layer,
 * enforcing business rules and providing caching for frequently accessed positions.
 *
 * @example
 * ```typescript
 * // Create service with repository
 * const repository = new SQLitePositionRepository();
 * const service = new PositionService(repository, {
 *   cacheEnabled: true,
 *   cacheSize: 100
 * });
 *
 * // Use service
 * const position = await service.getPosition(1);
 * const positions = await service.getPositionsByCategory('basic-checkmates');
 * ```
 */

import { IPositionRepository } from "@shared/repositories/IPositionRepository";
import { IPositionService, IPositionServiceConfig } from "./IPositionService";
import {
  EndgamePosition,
  EndgameCategory,
  EndgameChapter,
} from "@shared/types";
import { getLogger } from "@shared/services/logging";
import { LRUCache } from "@shared/lib/cache/LRUCache";
import { RepositoryError } from "./errors";
import { CACHE } from "@shared/constants";

const logger = getLogger().setContext("PositionService");

/**
 * Service for managing chess positions
 *
 * @class PositionService
 * @implements {IPositionService}
 *
 * @description
 * Implements the position service interface with caching and business logic.
 * Uses repository pattern for data access abstraction, allowing different
 * storage backends (SQLite, PostgreSQL, etc.) without changing service code.
 *
 * @example
 * ```typescript
 * const service = new PositionService(repository, {
 *   cacheEnabled: true,
 *   cacheSize: 200,
 *   cacheTTL: 300000 // 5 minutes
 * });
 * ```
 */
export class PositionService implements IPositionService {
  private repository: IPositionRepository;
  private cache?: LRUCache<EndgamePosition>;
  private config: IPositionServiceConfig;

  /**
   * Creates a new PositionService instance
   *
   * @param {IPositionRepository} repository - Data access repository
   * @param {IPositionServiceConfig} [config={}] - Service configuration
   *
   * @example
   * ```typescript
   * const service = new PositionService(repository, {
   *   cacheEnabled: true,
   *   cacheSize: 100
   * });
   * ```
   */
  constructor(
    repository: IPositionRepository,
    config: IPositionServiceConfig = {},
  ) {
    this.repository = repository;
    this.config = {
      cacheEnabled: true,
      cacheSize: CACHE.POSITION_CACHE_SIZE,
      cacheTTL: CACHE.ANALYSIS_CACHE_TTL,
      ...config,
    };

    if (this.config.cacheEnabled) {
      this.cache = new LRUCache<EndgamePosition>(this.config.cacheSize!);
    }

    logger.info("PositionService initialized", { config: this.config });
  }

  /**
   * Get a single position by ID
   *
   * @param {number} id - Position identifier
   * @returns {Promise<EndgamePosition | null>} Position if found, null otherwise
   * @throws {RepositoryError} If repository operation fails
   *
   * @description
   * Retrieves a position by ID with cache-first strategy.
   * If found in cache, returns immediately. Otherwise fetches
   * from repository and caches the result.
   *
   * @example
   * ```typescript
   * const position = await service.getPosition(1);
   * if (position) {
   *   console.log(position.title);
   * }
   * ```
   */
  async getPosition(id: number): Promise<EndgamePosition | null> {
    // Check cache first
    const cacheKey = id.toString();
    if (this.cache?.has(cacheKey)) {
      logger.debug("Cache hit for position", { id });
      return this.cache.get(cacheKey)!;
    }

    try {
      const position = await this.repository.getPosition(id);

      if (position && this.cache) {
        this.cache.set(cacheKey, position);
      }

      return position;
    } catch (error) {
      logger.error("Failed to get position", { id, error });
      throw new RepositoryError("getPosition", error as Error);
    }
  }

  /**
   * Get all positions
   *
   * @returns {Promise<EndgamePosition[]>} Array of all positions
   * @throws {RepositoryError} If repository operation fails
   *
   * @description
   * Retrieves all positions from the repository and caches
   * each position individually for future single-position lookups.
   *
   * @remarks
   * Use with caution on large datasets as this loads all positions
   * into memory. Consider using pagination or filtering for better
   * performance with large position databases.
   *
   * @example
   * ```typescript
   * const allPositions = await service.getAllPositions();
   * console.log(`Total positions: ${allPositions.length}`);
   * ```
   */
  async getAllPositions(): Promise<EndgamePosition[]> {
    try {
      const positions = await this.repository.getAllPositions();

      // Cache individual positions
      if (this.cache) {
        positions.forEach((position) => {
          this.cache!.set(position.id.toString(), position);
        });
      }

      return positions;
    } catch (error) {
      logger.error("Failed to get all positions", { error });
      throw new RepositoryError("getAllPositions", error as Error);
    }
  }

  /**
   * Get positions by category
   *
   * @param {string} category - Category identifier (e.g., 'basic-checkmates')
   * @returns {Promise<EndgamePosition[]>} Positions in the category
   *
   * @description
   * Retrieves all positions belonging to a specific category.
   * Results are cached individually for improved performance
   * on subsequent single-position lookups.
   *
   * @example
   * ```typescript
   * const checkmates = await service.getPositionsByCategory('basic-checkmates');
   * const rookEndgames = await service.getPositionsByCategory('rook-endgames');
   * ```
   */
  async getPositionsByCategory(category: string): Promise<EndgamePosition[]> {
    try {
      const positions = await this.repository.getPositionsByCategory(category);

      // Cache individual positions
      if (this.cache) {
        positions.forEach((position) => {
          this.cache!.set(position.id.toString(), position);
        });
      }

      return positions;
    } catch (error) {
      logger.error("Failed to get positions by category", { category, error });
      return [];
    }
  }

  /**
   * Get positions by difficulty
   * @param difficulty
   */
  async getPositionsByDifficulty(
    difficulty: EndgamePosition["difficulty"],
  ): Promise<EndgamePosition[]> {
    try {
      const positions =
        await this.repository.getPositionsByDifficulty(difficulty);

      // Cache individual positions
      if (this.cache) {
        positions.forEach((position) => {
          this.cache!.set(position.id.toString(), position);
        });
      }

      return positions;
    } catch (error) {
      logger.error("Failed to get positions by difficulty", {
        difficulty,
        error,
      });
      return [];
    }
  }

  /**
   * Search positions by title or description
   *
   * @param {string} searchTerm - Search query
   * @returns {Promise<EndgamePosition[]>} Matching positions
   *
   * @description
   * Performs full-text search across position titles and descriptions.
   * Empty or whitespace-only search terms return empty results.
   * Search is delegated to the repository implementation.
   *
   * @example
   * ```typescript
   * const results = await service.searchPositions('rook checkmate');
   * const queenEndgames = await service.searchPositions('queen vs pawn');
   * ```
   */
  async searchPositions(searchTerm: string): Promise<EndgamePosition[]> {
    if (!searchTerm.trim()) {
      return [];
    }

    try {
      const positions = await this.repository.searchPositions(searchTerm);

      // Cache individual positions
      if (this.cache) {
        positions.forEach((position) => {
          this.cache!.set(position.id.toString(), position);
        });
      }

      return positions;
    } catch (error) {
      logger.error("Failed to search positions", { searchTerm, error });
      return [];
    }
  }

  /**
   * Clear the cache
   *
   * @description
   * Removes all cached positions from memory.
   * Useful for testing or when positions are updated externally.
   *
   * @example
   * ```typescript
   * service.clearCache();
   * console.log('Cache cleared');
   * ```
   */
  clearCache(): void {
    this.cache?.clear();
    logger.info("Position cache cleared");
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Cache statistics
   * @returns {number} returns.size - Number of cached items
   * @returns {number[]} returns.keys - Array of cached position IDs
   * @returns {boolean} returns.enabled - Whether caching is enabled
   *
   * @description
   * Provides insight into cache usage for monitoring and debugging.
   *
   * @example
   * ```typescript
   * const stats = service.getCacheStats();
   * console.log(`Cached positions: ${stats.size}`);
   * console.log(`Cache enabled: ${stats.enabled}`);
   * ```
   */
  getCacheStats(): { size: number; keys: number[]; enabled: boolean } {
    if (!this.cache) {
      return { size: 0, keys: [], enabled: false };
    }

    const stats = this.cache.getStats();
    const keys = this.cache.keys().map((key) => parseInt(key, 10));
    return {
      size: stats.size,
      keys: keys,
      enabled: true,
    };
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<EndgameCategory[]> {
    try {
      return await this.repository.getCategories();
    } catch (error) {
      logger.error("Failed to get categories", { error });
      return [];
    }
  }

  /**
   * Get all chapters
   */
  async getChapters(): Promise<EndgameChapter[]> {
    try {
      return await this.repository.getChapters();
    } catch (error) {
      logger.error("Failed to get chapters", { error });
      return [];
    }
  }

  /**
   * Get chapters by category
   * @param categoryId
   */
  async getChaptersByCategory(categoryId: string): Promise<EndgameChapter[]> {
    try {
      return await this.repository.getChaptersByCategory(categoryId);
    } catch (error) {
      logger.error("Failed to get chapters by category", { categoryId, error });
      return [];
    }
  }

  /**
   * Get next position in sequence (for navigation)
   *
   * @param {number} currentId - Current position ID
   * @param {string} [categoryId] - Optional category constraint
   * @returns {Promise<EndgamePosition | null>} Next position or null
   *
   * @description
   * Retrieves the next position in sequence, optionally within
   * the same category. Used for navigation between positions.
   *
   * @example
   * ```typescript
   * // Get next position in any category
   * const next = await service.getNextPosition(5);
   *
   * // Get next position in same category
   * const nextInCategory = await service.getNextPosition(5, 'rook-endgames');
   * ```
   */
  async getNextPosition(
    currentId: number,
    categoryId?: string,
  ): Promise<EndgamePosition | null> {
    try {
      const position = await this.repository.getNextPosition(
        currentId,
        categoryId,
      );

      if (position && this.cache) {
        this.cache.set(position.id.toString(), position);
      }

      return position;
    } catch (error) {
      logger.error("Failed to get next position", {
        currentId,
        categoryId,
        error,
      });
      return null;
    }
  }

  /**
   * Get previous position in sequence (for navigation)
   * @param currentId
   * @param categoryId
   */
  async getPreviousPosition(
    currentId: number,
    categoryId?: string,
  ): Promise<EndgamePosition | null> {
    try {
      const position = await this.repository.getPreviousPosition(
        currentId,
        categoryId,
      );

      if (position && this.cache) {
        this.cache.set(position.id.toString(), position);
      }

      return position;
    } catch (error) {
      logger.error("Failed to get previous position", {
        currentId,
        categoryId,
        error,
      });
      return null;
    }
  }

  /**
   * Get total position count
   */
  async getTotalPositionCount(): Promise<number> {
    try {
      return await this.repository.getTotalPositionCount();
    } catch (error) {
      logger.error("Failed to get position count", { error });
      return 0;
    }
  }

  /**
   * Get position count by category
   * @param categoryId
   */
  async getPositionCountByCategory(categoryId: string): Promise<number> {
    try {
      return await this.repository.getPositionCountByCategory(categoryId);
    } catch (error) {
      logger.error("Failed to get position count by category", {
        categoryId,
        error,
      });
      return 0;
    }
  }

  /**
   * Create a new position (admin functionality)
   *
   * @param {Omit<EndgamePosition, 'id'>} position - Position data without ID
   * @returns {Promise<EndgamePosition | null>} Created position or null on failure
   *
   * @description
   * Creates a new position in the repository. The ID is auto-generated
   * by the storage backend. Created position is automatically cached.
   *
   * @remarks
   * This is an administrative function that may require special
   * permissions in production environments.
   *
   * @example
   * ```typescript
   * const newPosition = await service.createPosition({
   *   title: 'Queen vs Rook',
   *   fen: '8/8/8/8/3Q4/8/8/3rk3 w - - 0 1',
   *   category: 'queen-endgames',
   *   difficulty: 'advanced'
   * });
   * ```
   */
  async createPosition(
    position: Omit<EndgamePosition, "id">,
  ): Promise<EndgamePosition | null> {
    try {
      const created = await this.repository.createPosition(position);

      if (this.cache) {
        this.cache.set(created.id.toString(), created);
      }

      logger.info("Position created", { id: created.id });
      return created;
    } catch (error) {
      logger.error("Failed to create position", { error });
      return null;
    }
  }

  /**
   * Update a position (admin functionality)
   * @param id
   * @param updates
   */
  async updatePosition(
    id: number,
    updates: Partial<EndgamePosition>,
  ): Promise<EndgamePosition | null> {
    try {
      const updated = await this.repository.updatePosition(id, updates);

      if (updated && this.cache) {
        this.cache.set(id.toString(), updated);
      }

      logger.info("Position updated", { id });
      return updated;
    } catch (error) {
      logger.error("Failed to update position", { id, error });
      return null;
    }
  }

  /**
   * Delete a position (admin functionality)
   * @param id
   */
  async deletePosition(id: number): Promise<boolean> {
    try {
      const deleted = await this.repository.deletePosition(id);

      if (deleted && this.cache) {
        this.cache.delete(id.toString());
      }

      logger.info("Position deleted", { id });
      return deleted;
    } catch (error) {
      logger.error("Failed to delete position", { id, error });
      return false;
    }
  }
}
