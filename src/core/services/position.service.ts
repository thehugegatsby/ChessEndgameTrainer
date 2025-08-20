import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit
} from 'firebase/firestore';
import type { Firestore, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { Position, Result } from '../types';
import { createOk, createError } from '../types';

export type PositionError =
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'FIREBASE_ERROR'; message: string }
  | { code: 'NO_POSITIONS'; message: string }
  | { code: 'INVALID_DATA'; message: string }
  | { code: 'POSITION_ERROR'; message: string };

/**
 * PositionService - Handles Firebase Firestore integration
 * Manages training positions from the database
 */
export class PositionService {
  private readonly collectionName = 'positions';
  private positionCache: Map<string, Position> = new Map();
  private categoryCache: Map<string, Position[]> = new Map();
  private cacheExpiry = 300000; // 5 minutes
  private lastCacheTime = 0;

  constructor(private db: Firestore | null) {}

  /**
   * Get a random position from the database
   */
  async getRandomPosition(category?: string): Promise<Result<Position, PositionError>> {
    if (!this.db) {
      return createError({
        code: 'FIREBASE_ERROR',
        message: 'Firebase is not initialized'
      });
    }

    try {
      // Check cache first
      if (category && this.categoryCache.has(category)) {
        const positions = this.categoryCache.get(category)!;
        if (positions.length > 0) {
          const randomIndex = Math.floor(Math.random() * positions.length);
          const position = positions[randomIndex];
          if (position) {
            return createOk(position);
          }
        }
      }

      // Query database
      let q = collection(this.db, this.collectionName);
      
      if (category) {
        q = query(q, where('category', '==', category)) as any;
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return createError({
          code: 'NO_POSITIONS',
          message: category 
            ? `No positions found for category: ${category}` 
            : 'No positions found in database'
        });
      }

      // Convert to Position array
      const positions = snapshot.docs.map(doc => this.docToPosition(doc));
      
      // Cache if category query
      if (category) {
        this.categoryCache.set(category, positions);
      }

      // Return random position
      if (positions.length === 0) {
        return createError({
          code: 'NO_POSITIONS',
          message: 'No positions found'
        });
      }
      
      const randomIndex = Math.floor(Math.random() * positions.length);
      const position = positions[randomIndex];
      
      if (!position) {
        return createError({
          code: 'POSITION_ERROR',
          message: 'Could not select position'
        });
      }
      
      // Cache individual position
      this.positionCache.set(position.id, position);
      
      return createOk(position);

    } catch (error) {
      return createError({
        code: 'FIREBASE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown Firebase error'
      });
    }
  }

  /**
   * Get a specific position by ID
   */
  async getPositionById(id: string): Promise<Result<Position, PositionError>> {
    if (!this.db) {
      return createError({
        code: 'FIREBASE_ERROR',
        message: 'Firebase is not initialized'
      });
    }

    // Check cache first
    if (this.positionCache.has(id)) {
      return createOk(this.positionCache.get(id)!);
    }

    try {
      const docRef = doc(this.db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return createError({
          code: 'NOT_FOUND',
          message: `Position with ID ${id} not found`
        });
      }

      const position = this.docToPosition(docSnap as QueryDocumentSnapshot);
      
      // Cache the position
      this.positionCache.set(id, position);
      
      return createOk(position);

    } catch (error) {
      return createError({
        code: 'FIREBASE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown Firebase error'
      });
    }
  }

  /**
   * Get positions by category with optional limit
   */
  async getPositionsByCategory(
    category: string, 
    limitCount: number = 10
  ): Promise<Result<Position[], PositionError>> {
    if (!this.db) {
      return createError({
        code: 'FIREBASE_ERROR',
        message: 'Firebase is not initialized'
      });
    }

    // Check cache
    if (this.categoryCache.has(category)) {
      const cached = this.categoryCache.get(category)!;
      return createOk(cached.slice(0, limitCount));
    }

    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('category', '==', category),
        orderBy('difficulty', 'asc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const positions = snapshot.docs.map(doc => this.docToPosition(doc));
      
      // Cache the results
      this.categoryCache.set(category, positions);
      positions.forEach(pos => this.positionCache.set(pos.id, pos));

      return createOk(positions);

    } catch (error) {
      return createError({
        code: 'FIREBASE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown Firebase error'
      });
    }
  }

  /**
   * Get next/previous position for navigation
   */
  async getAdjacentPosition(
    currentId: string, 
    direction: 'next' | 'previous'
  ): Promise<Result<Position, PositionError>> {
    if (!this.db) {
      return createError({
        code: 'FIREBASE_ERROR',
        message: 'Firebase is not initialized'
      });
    }

    // For now, just get a random position
    // In production, this would maintain order within category
    return this.getRandomPosition();
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<Result<string[], PositionError>> {
    if (!this.db) {
      return createError({
        code: 'FIREBASE_ERROR',
        message: 'Firebase is not initialized'
      });
    }

    try {
      // In production, this would be a distinct query or separate collection
      // For now, fetch some positions and extract categories
      const q = query(
        collection(this.db, this.collectionName),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const categories = new Set<string>();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
        }
      });

      return createOk(Array.from(categories).sort());

    } catch (error) {
      return createError({
        code: 'FIREBASE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown Firebase error'
      });
    }
  }

  // ========== Cache Management ==========
  
  clearCache(): void {
    this.positionCache.clear();
    this.categoryCache.clear();
    this.lastCacheTime = 0;
  }

  getCacheStats() {
    return {
      positionsCached: this.positionCache.size,
      categoriesCached: this.categoryCache.size,
      cacheAge: Date.now() - this.lastCacheTime
    };
  }

  // ========== Helpers ==========
  
  private docToPosition(doc: QueryDocumentSnapshot | DocumentData): Position {
    const data = 'data' in doc ? doc.data() : doc;
    const id = 'id' in doc ? doc.id : data.id;
    
    // Validate required fields
    if (!data.fen || !data.category) {
      throw new Error(`Invalid position data for document ${id}`);
    }

    return {
      id,
      fen: data.fen,
      category: data.category,
      difficulty: data.difficulty || 5,
      sideToMove: data.sideToMove || this.extractSideFromFen(data.fen),
      pieceCount: data.pieceCount || this.countPiecesInFen(data.fen),
      tags: data.tags || [],
      source: data.source || 'curated',
      createdAt: data.createdAt?.toDate?.() || new Date()
    };
  }

  private extractSideFromFen(fen: string): 'w' | 'b' {
    const parts = fen.split(' ');
    return parts[1] === 'b' ? 'b' : 'w';
  }

  private countPiecesInFen(fen: string): number {
    const piecePart = fen.split(' ')[0];
    if (!piecePart) return 0;
    return (piecePart.match(/[pnbrqkPNBRQK]/g) || []).length;
  }
}