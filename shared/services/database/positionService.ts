import { doc, getDoc, collection, getDocs, query, where, Query, DocumentData } from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import { EndgamePosition, EndgameCategory } from '@shared/types';
import { getPositionById as getPositionFromArray, allEndgamePositions } from '@shared/data/endgames';
import { getLogger } from '@shared/services/logging';
import { validateAndSanitizeFen } from '@shared/utils/fenValidator';

const logger = getLogger();

/**
 * Service for accessing chess positions with dual-read pattern
 * Supports both Firestore and TypeScript array sources
 */
export class PositionService {
  private useFirestore: boolean;
  private cache: Map<number, EndgamePosition> = new Map();

  constructor() {
    // Check if Firestore should be used
    this.useFirestore = process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true';
    logger.info(`PositionService initialized with Firestore=${this.useFirestore}`);
  }

  /**
   * Get a single position by ID
   */
  async getPosition(id: number): Promise<EndgamePosition | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    if (!this.useFirestore) {
      const position = getPositionFromArray(id);
      if (position) {
        this.cache.set(id, position);
      }
      return position ?? null;
    }

    try {
      // Try Firestore first
      const docRef = doc(db, 'positions', id.toString());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const position = docSnap.data() as EndgamePosition;
        
        // Validate FEN from Firestore to prevent malicious data
        if (position.fen) {
          const validation = validateAndSanitizeFen(position.fen);
          if (!validation.isValid) {
            logger.error(`Invalid FEN from Firestore for position ${id}: ${validation.errors.join(', ')}`);
            // Fall back to array data
            const arrayPosition = getPositionFromArray(id);
            if (arrayPosition) {
              this.cache.set(id, arrayPosition);
            }
            return arrayPosition ?? null;
          }
          position.fen = validation.sanitized;
        }
        
        this.cache.set(id, position);
        return position;
      }
      
      // Fallback to array if not found in Firestore
      logger.warn(`Position ${id} not found in Firestore, falling back to array`);
      const arrayPosition = getPositionFromArray(id);
      if (arrayPosition) {
        this.cache.set(id, arrayPosition);
      }
      return arrayPosition ?? null;
    } catch (error) {
      logger.error('Firestore read error, falling back to array:', error);
      // Fallback on error
      const arrayPosition = getPositionFromArray(id);
      if (arrayPosition) {
        this.cache.set(id, arrayPosition);
      }
      return arrayPosition ?? null;
    }
  }

  /**
   * Get all positions
   */
  async getAllPositions(): Promise<EndgamePosition[]> {
    if (!this.useFirestore) {
      return allEndgamePositions;
    }

    try {
      const positionsRef = collection(db, 'positions');
      const snapshot = await getDocs(positionsRef);
      
      const positions: EndgamePosition[] = [];
      snapshot.forEach((doc) => {
        const position = doc.data() as EndgamePosition;
        
        // Validate FEN from Firestore
        if (position.fen) {
          const validation = validateAndSanitizeFen(position.fen);
          if (!validation.isValid) {
            logger.error(`Invalid FEN from Firestore for position ${position.id}: ${validation.errors.join(', ')}`);
            return; // Skip this position
          }
          position.fen = validation.sanitized;
        }
        
        positions.push(position);
        // Cache each position
        this.cache.set(position.id, position);
      });

      if (positions.length === 0) {
        logger.warn('No positions found in Firestore, falling back to array');
        return allEndgamePositions;
      }

      return positions;
    } catch (error) {
      logger.error('Failed to fetch all positions from Firestore:', error);
      return allEndgamePositions;
    }
  }

  /**
   * Get positions by category
   */
  async getPositionsByCategory(category: string): Promise<EndgamePosition[]> {
    if (!this.useFirestore) {
      return allEndgamePositions.filter(p => p.category === category);
    }

    try {
      const positionsRef = collection(db, 'positions');
      const q = query(positionsRef, where('category', '==', category));
      const snapshot = await getDocs(q);
      
      const positions: EndgamePosition[] = [];
      snapshot.forEach((doc) => {
        const position = doc.data() as EndgamePosition;
        
        // Validate FEN from Firestore
        if (position.fen) {
          const validation = validateAndSanitizeFen(position.fen);
          if (!validation.isValid) {
            logger.error(`Invalid FEN from Firestore for position ${position.id}: ${validation.errors.join(', ')}`);
            return; // Skip this position
          }
          position.fen = validation.sanitized;
        }
        
        positions.push(position);
        this.cache.set(position.id, position);
      });

      if (positions.length === 0) {
        logger.warn(`No positions found in Firestore for category ${category}, falling back to array`);
        return allEndgamePositions.filter(p => p.category === category);
      }

      return positions;
    } catch (error) {
      logger.error(`Failed to fetch positions for category ${category}:`, error);
      return allEndgamePositions.filter(p => p.category === category);
    }
  }

  /**
   * Get positions by difficulty
   */
  async getPositionsByDifficulty(difficulty: string): Promise<EndgamePosition[]> {
    if (!this.useFirestore) {
      return allEndgamePositions.filter(p => p.difficulty === difficulty);
    }

    try {
      const positionsRef = collection(db, 'positions');
      const q = query(positionsRef, where('difficulty', '==', difficulty));
      const snapshot = await getDocs(q);
      
      const positions: EndgamePosition[] = [];
      snapshot.forEach((doc) => {
        const position = doc.data() as EndgamePosition;
        
        // Validate FEN from Firestore
        if (position.fen) {
          const validation = validateAndSanitizeFen(position.fen);
          if (!validation.isValid) {
            logger.error(`Invalid FEN from Firestore for position ${position.id}: ${validation.errors.join(', ')}`);
            return; // Skip this position
          }
          position.fen = validation.sanitized;
        }
        
        positions.push(position);
        this.cache.set(position.id, position);
      });

      if (positions.length === 0) {
        logger.warn(`No positions found in Firestore for difficulty ${difficulty}, falling back to array`);
        return allEndgamePositions.filter(p => p.difficulty === difficulty);
      }

      return positions;
    } catch (error) {
      logger.error(`Failed to fetch positions for difficulty ${difficulty}:`, error);
      return allEndgamePositions.filter(p => p.difficulty === difficulty);
    }
  }

  /**
   * Search positions by title or description
   */
  async searchPositions(searchTerm: string): Promise<EndgamePosition[]> {
    const lowerSearch = searchTerm.toLowerCase();

    if (!this.useFirestore) {
      return allEndgamePositions.filter(p => 
        p.title.toLowerCase().includes(lowerSearch) ||
        p.description.toLowerCase().includes(lowerSearch)
      );
    }

    try {
      // Firestore doesn't support full-text search natively
      // For now, fetch all and filter client-side
      // In production, consider using Algolia or Elasticsearch
      const positions = await this.getAllPositions();
      return positions.filter(p => 
        p.title.toLowerCase().includes(lowerSearch) ||
        p.description.toLowerCase().includes(lowerSearch)
      );
    } catch (error) {
      logger.error('Failed to search positions:', error);
      return allEndgamePositions.filter(p => 
        p.title.toLowerCase().includes(lowerSearch) ||
        p.description.toLowerCase().includes(lowerSearch)
      );
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Position cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: number[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const positionService = new PositionService();