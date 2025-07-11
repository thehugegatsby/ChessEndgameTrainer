import { doc, getDoc, collection, getDocs, query, where, Query, DocumentData } from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import { EndgamePosition, EndgameCategory } from '@shared/types';
import { getLogger } from '@shared/services/logging';
import { validateAndSanitizeFen } from '@shared/utils/fenValidator';

const logger = getLogger();

/**
 * Service for accessing chess positions from Firestore
 */
export class PositionService {
  private cache: Map<number, EndgamePosition> = new Map();

  constructor() {
    logger.info('PositionService initialized with Firestore');
  }

  /**
   * Get a single position by ID
   */
  async getPosition(id: number): Promise<EndgamePosition | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    try {
      const docRef = doc(db, 'positions', id.toString());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const position = docSnap.data() as EndgamePosition;
        
        // Validate FEN from Firestore to prevent malicious data
        if (position.fen) {
          const validation = validateAndSanitizeFen(position.fen);
          if (!validation.isValid) {
            logger.error(`Invalid FEN from Firestore for position ${id}: ${validation.errors.join(', ')}`);
            return null;
          }
          position.fen = validation.sanitized;
        }
        
        this.cache.set(id, position);
        return position;
      }
      
      logger.warn(`Position ${id} not found in Firestore`);
      return null;
    } catch (error) {
      logger.error('Firestore read error:', error);
      return null;
    }
  }

  /**
   * Get all positions
   */
  async getAllPositions(): Promise<EndgamePosition[]> {
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
        logger.warn('No positions found in Firestore');
      }

      return positions;
    } catch (error) {
      logger.error('Failed to fetch all positions from Firestore:', error);
      return [];
    }
  }

  /**
   * Get positions by category
   */
  async getPositionsByCategory(category: string): Promise<EndgamePosition[]> {
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
        logger.warn(`No positions found in Firestore for category ${category}`);
      }

      return positions;
    } catch (error) {
      logger.error(`Failed to fetch positions for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Get positions by difficulty
   */
  async getPositionsByDifficulty(difficulty: string): Promise<EndgamePosition[]> {
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
        logger.warn(`No positions found in Firestore for difficulty ${difficulty}`);
      }

      return positions;
    } catch (error) {
      logger.error(`Failed to fetch positions for difficulty ${difficulty}:`, error);
      return [];
    }
  }

  /**
   * Search positions by title or description
   */
  async searchPositions(searchTerm: string): Promise<EndgamePosition[]> {
    const lowerSearch = searchTerm.toLowerCase();

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
      return [];
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