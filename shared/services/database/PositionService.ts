/**
 * Position Service - Business Logic Layer
 * Handles position-related operations with caching and business rules
 * Completely decoupled from data access implementation
 */

import { IPositionRepository } from '@shared/repositories/IPositionRepository';
import { IPositionService, IPositionServiceConfig } from './IPositionService';
import { EndgamePosition, EndgameCategory, EndgameChapter } from '@shared/types';
import { getLogger } from '@shared/services/logging';
import { LRUCache } from '@shared/lib/cache/LRUCache';
import { RepositoryError } from './errors';
import { CACHE } from '@shared/constants';

const logger = getLogger().setContext('PositionService');

/**
 * Service for managing chess positions
 * Implements IPositionService interface for better abstraction
 * Uses repository pattern for data access
 */
export class PositionService implements IPositionService {
  private repository: IPositionRepository;
  private cache?: LRUCache<EndgamePosition>;
  private config: IPositionServiceConfig;

  constructor(
    repository: IPositionRepository,
    config: IPositionServiceConfig = {}
  ) {
    this.repository = repository;
    this.config = {
      cacheEnabled: true,
      cacheSize: CACHE.POSITION_CACHE_SIZE,
      cacheTTL: CACHE.ENGINE_CACHE_TTL,
      ...config
    };

    if (this.config.cacheEnabled) {
      this.cache = new LRUCache<EndgamePosition>(this.config.cacheSize!);
    }

    logger.info('PositionService initialized', { config: this.config });
  }

  /**
   * Get a single position by ID
   * @throws {RepositoryError} If repository operation fails
   * @returns Position if found, null if not found
   */
  async getPosition(id: number): Promise<EndgamePosition | null> {
    // Check cache first
    const cacheKey = id.toString();
    if (this.cache?.has(cacheKey)) {
      logger.debug('Cache hit for position', { id });
      return this.cache.get(cacheKey)!;
    }

    try {
      const position = await this.repository.getPosition(id);
      
      if (position && this.cache) {
        this.cache.set(cacheKey, position);
      }
      
      return position;
    } catch (error) {
      logger.error('Failed to get position', { id, error });
      throw new RepositoryError('getPosition', error as Error);
    }
  }

  /**
   * Get all positions
   * @throws {RepositoryError} If repository operation fails
   */
  async getAllPositions(): Promise<EndgamePosition[]> {
    try {
      const positions = await this.repository.getAllPositions();
      
      // Cache individual positions
      if (this.cache) {
        positions.forEach(position => {
          this.cache!.set(position.id.toString(), position);
        });
      }
      
      return positions;
    } catch (error) {
      logger.error('Failed to get all positions', { error });
      throw new RepositoryError('getAllPositions', error as Error);
    }
  }

  /**
   * Get positions by category
   */
  async getPositionsByCategory(category: string): Promise<EndgamePosition[]> {
    try {
      const positions = await this.repository.getPositionsByCategory(category);
      
      // Cache individual positions
      if (this.cache) {
        positions.forEach(position => {
          this.cache!.set(position.id.toString(), position);
        });
      }
      
      return positions;
    } catch (error) {
      logger.error('Failed to get positions by category', { category, error });
      return [];
    }
  }

  /**
   * Get positions by difficulty
   */
  async getPositionsByDifficulty(difficulty: EndgamePosition['difficulty']): Promise<EndgamePosition[]> {
    try {
      const positions = await this.repository.getPositionsByDifficulty(difficulty);
      
      // Cache individual positions
      if (this.cache) {
        positions.forEach(position => {
          this.cache!.set(position.id.toString(), position);
        });
      }
      
      return positions;
    } catch (error) {
      logger.error('Failed to get positions by difficulty', { difficulty, error });
      return [];
    }
  }

  /**
   * Search positions by title or description
   */
  async searchPositions(searchTerm: string): Promise<EndgamePosition[]> {
    if (!searchTerm.trim()) {
      return [];
    }

    try {
      const positions = await this.repository.searchPositions(searchTerm);
      
      // Cache individual positions
      if (this.cache) {
        positions.forEach(position => {
          this.cache!.set(position.id.toString(), position);
        });
      }
      
      return positions;
    } catch (error) {
      logger.error('Failed to search positions', { searchTerm, error });
      return [];
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache?.clear();
    logger.info('Position cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: number[]; enabled: boolean } {
    if (!this.cache) {
      return { size: 0, keys: [], enabled: false };
    }

    const stats = this.cache.getStats();
    const keys = this.cache.keys().map(key => parseInt(key, 10));
    return {
      size: stats.size,
      keys: keys,
      enabled: true
    };
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<EndgameCategory[]> {
    try {
      return await this.repository.getCategories();
    } catch (error) {
      logger.error('Failed to get categories', { error });
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
      logger.error('Failed to get chapters', { error });
      return [];
    }
  }

  /**
   * Get chapters by category
   */
  async getChaptersByCategory(categoryId: string): Promise<EndgameChapter[]> {
    try {
      return await this.repository.getChaptersByCategory(categoryId);
    } catch (error) {
      logger.error('Failed to get chapters by category', { categoryId, error });
      return [];
    }
  }

  /**
   * Get next position in sequence (for navigation)
   */
  async getNextPosition(currentId: number, categoryId?: string): Promise<EndgamePosition | null> {
    try {
      const position = await this.repository.getNextPosition(currentId, categoryId);
      
      if (position && this.cache) {
        this.cache.set(position.id.toString(), position);
      }
      
      return position;
    } catch (error) {
      logger.error('Failed to get next position', { currentId, categoryId, error });
      return null;
    }
  }

  /**
   * Get previous position in sequence (for navigation)
   */
  async getPreviousPosition(currentId: number, categoryId?: string): Promise<EndgamePosition | null> {
    try {
      const position = await this.repository.getPreviousPosition(currentId, categoryId);
      
      if (position && this.cache) {
        this.cache.set(position.id.toString(), position);
      }
      
      return position;
    } catch (error) {
      logger.error('Failed to get previous position', { currentId, categoryId, error });
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
      logger.error('Failed to get position count', { error });
      return 0;
    }
  }

  /**
   * Get position count by category
   */
  async getPositionCountByCategory(categoryId: string): Promise<number> {
    try {
      return await this.repository.getPositionCountByCategory(categoryId);
    } catch (error) {
      logger.error('Failed to get position count by category', { categoryId, error });
      return 0;
    }
  }

  /**
   * Create a new position (admin functionality)
   */
  async createPosition(position: Omit<EndgamePosition, 'id'>): Promise<EndgamePosition | null> {
    try {
      const created = await this.repository.createPosition(position);
      
      if (this.cache) {
        this.cache.set(created.id.toString(), created);
      }
      
      logger.info('Position created', { id: created.id });
      return created;
    } catch (error) {
      logger.error('Failed to create position', { error });
      return null;
    }
  }

  /**
   * Update a position (admin functionality)
   */
  async updatePosition(id: number, updates: Partial<EndgamePosition>): Promise<EndgamePosition | null> {
    try {
      const updated = await this.repository.updatePosition(id, updates);
      
      if (updated && this.cache) {
        this.cache.set(id.toString(), updated);
      }
      
      logger.info('Position updated', { id });
      return updated;
    } catch (error) {
      logger.error('Failed to update position', { id, error });
      return null;
    }
  }

  /**
   * Delete a position (admin functionality)
   */
  async deletePosition(id: number): Promise<boolean> {
    try {
      const deleted = await this.repository.deletePosition(id);
      
      if (deleted && this.cache) {
        this.cache.delete(id.toString());
      }
      
      logger.info('Position deleted', { id });
      return deleted;
    } catch (error) {
      logger.error('Failed to delete position', { id, error });
      return false;
    }
  }
}