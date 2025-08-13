/**
 * Firebase implementation of IPositionRepository
 * Encapsulates all Firebase-specific logic
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type Firestore,
  writeBatch,
  type Query,
} from "firebase/firestore";

import {
  type PositionRepository,
  type PositionRepositoryConfig,
} from "../IPositionRepository";
import {
  type EndgamePosition,
  type EndgameCategory,
  type EndgameChapter,
} from "@shared/types";
import { validateAndSanitizeFen } from "@shared/utils/fenValidator";
import { getLogger } from "@shared/services/logging";

const logger = getLogger().setContext("FirebasePositionRepository");

export class FirebasePositionRepository implements PositionRepository {
  private db: Firestore;
  private config: PositionRepositoryConfig;

  constructor(firestore: Firestore, config: PositionRepositoryConfig = {}) {
    this.db = firestore;
    this.config = config;
    logger.info("FirebasePositionRepository initialized", { config });
  }

  async getPosition(id: number): Promise<EndgamePosition | null> {
    try {
      const docRef = doc(this.db, "positions", id.toString());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const position: EndgamePosition = { ...data, id } as EndgamePosition;
        // Validate FEN
        if (position.fen) {
          const validation = validateAndSanitizeFen(position.fen);
          if (!validation.isValid) {
            logger.error(
              `Invalid FEN from Firestore for position ${id}: ${validation.errors.join(", ")}`,
            );
            throw new Error("Invalid position data");
          }
          position.fen = validation.sanitized;
        }
        this.config.events?.onDataFetched?.("getPosition", 1);
        return position;
      }

      logger.warn(`Position ${id} not found`);
      return null;
    } catch (error) {
      logger.error("Failed to get position", error as Error, { id });
      this.config.events?.onError?.("getPosition", error as Error);
      throw error;
    }
  }

  async createPosition(
    data: Omit<EndgamePosition, "id">,
  ): Promise<EndgamePosition> {
    try {
      // Generate unique ID using crypto.randomUUID for collision-free identifiers
      const uniqueId = crypto.randomUUID();
      // Convert to number for compatibility with existing EndgamePosition.id type
      // Using hash code of the UUID string
      const id = Math.abs(
        uniqueId.split("").reduce((acc, char) => {
          const hash = (acc << 5) - acc + char.charCodeAt(0);
          return hash & hash;
        }, 0),
      );
      const position: EndgamePosition = { ...data, id };

      // Validate FEN before saving
      if (position.fen) {
        const validation = validateAndSanitizeFen(position.fen);
        if (!validation.isValid) {
          throw new Error(`Invalid FEN: ${validation.errors.join(", ")}`);
        }
        position.fen = validation.sanitized;
      }

      const docRef = doc(this.db, "positions", id.toString());
      await setDoc(docRef, position);

      this.config.events?.onDataModified?.("createPosition", [id]);
      return position;
    } catch (error) {
      logger.error("Failed to create position", error as Error);
      this.config.events?.onError?.("createPosition", error as Error);
      throw error;
    }
  }

  async updatePosition(
    id: number,
    updates: Partial<EndgamePosition>,
  ): Promise<EndgamePosition | null> {
    try {
      // Validate FEN if provided
      let sanitizedUpdates = updates;
      if (updates.fen) {
        const validation = validateAndSanitizeFen(updates.fen);
        if (!validation.isValid) {
          throw new Error(`Invalid FEN: ${validation.errors.join(", ")}`);
        }
        sanitizedUpdates = { ...updates, fen: validation.sanitized };
      }

      const docRef = doc(this.db, "positions", id.toString());
      await updateDoc(docRef, sanitizedUpdates as DocumentData);

      this.config.events?.onDataModified?.("updatePosition", [id]);
      return this.getPosition(id);
    } catch (error) {
      logger.error("Failed to update position", error as Error, { id });
      this.config.events?.onError?.("updatePosition", error as Error);
      throw error;
    }
  }

  async deletePosition(id: number): Promise<boolean> {
    try {
      const docRef = doc(this.db, "positions", id.toString());
      await deleteDoc(docRef);

      this.config.events?.onDataModified?.("deletePosition", [id]);
      return true;
    } catch (error) {
      logger.error("Failed to delete position", error as Error, { id });
      this.config.events?.onError?.("deletePosition", error as Error);
      return false;
    }
  }

  async getAllPositions(): Promise<EndgamePosition[]> {
    try {
      const positionsRef = collection(this.db, "positions");
      const snapshot = await getDocs(positionsRef);

      const positions: EndgamePosition[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const position: EndgamePosition = {
          ...data,
          id: parseInt(doc.id),
        } as EndgamePosition;
        // Validate FEN
        if (position.fen) {
          const validation = validateAndSanitizeFen(position.fen);
          if (validation.isValid) {
            position.fen = validation.sanitized;
            positions.push(position);
          } else {
            logger.error(
              `Invalid FEN for position ${position.id}: ${validation.errors.join(", ")}`,
            );
          }
        } else {
          positions.push(position);
        }
      });

      this.config.events?.onDataFetched?.("getAllPositions", positions.length);
      return positions;
    } catch (error) {
      logger.error("Failed to get all positions", error as Error);
      this.config.events?.onError?.("getAllPositions", error as Error);
      return [];
    }
  }

  async getPositionsByCategory(category: string): Promise<EndgamePosition[]> {
    try {
      const positionsRef = collection(this.db, "positions");
      const q = query(positionsRef, where("category", "==", category));
      const snapshot = await getDocs(q);

      const positions: EndgamePosition[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const position: EndgamePosition = {
          ...data,
          id: parseInt(doc.id),
        } as EndgamePosition;
        // Validate FEN
        if (position.fen) {
          const validation = validateAndSanitizeFen(position.fen);
          if (validation.isValid) {
            position.fen = validation.sanitized;
            positions.push(position);
          } else {
            logger.error(
              `Invalid FEN for position ${position.id}: ${validation.errors.join(", ")}`,
            );
          }
        } else {
          positions.push(position);
        }
      });

      this.config.events?.onDataFetched?.(
        "getPositionsByCategory",
        positions.length,
      );
      return positions;
    } catch (error) {
      logger.error("Failed to get positions by category", error as Error, {
        category,
      });
      this.config.events?.onError?.("getPositionsByCategory", error as Error);
      return [];
    }
  }

  async getPositionsByDifficulty(
    difficulty: EndgamePosition["difficulty"],
  ): Promise<EndgamePosition[]> {
    try {
      const positionsRef = collection(this.db, "positions");
      const q = query(positionsRef, where("difficulty", "==", difficulty));
      const snapshot = await getDocs(q);

      const positions: EndgamePosition[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const position: EndgamePosition = {
          ...data,
          id: parseInt(doc.id),
        } as EndgamePosition;
        // Validate FEN
        if (position.fen) {
          const validation = validateAndSanitizeFen(position.fen);
          if (validation.isValid) {
            position.fen = validation.sanitized;
            positions.push(position);
          } else {
            logger.error(
              `Invalid FEN for position ${position.id}: ${validation.errors.join(", ")}`,
            );
          }
        } else {
          positions.push(position);
        }
      });

      this.config.events?.onDataFetched?.(
        "getPositionsByDifficulty",
        positions.length,
      );
      return positions;
    } catch (error) {
      logger.error("Failed to get positions by difficulty", error as Error, {
        difficulty,
      });
      this.config.events?.onError?.("getPositionsByDifficulty", error as Error);
      return [];
    }
  }

  async getPositionsByIds(ids: number[]): Promise<EndgamePosition[]> {
    try {
      const positions = await Promise.all(
        ids.map((id) => this.getPosition(id)),
      );

      const validPositions = positions.filter(
        (p): p is EndgamePosition => p !== null,
      );
      this.config.events?.onDataFetched?.(
        "getPositionsByIds",
        validPositions.length,
      );

      return validPositions;
    } catch (error) {
      logger.error("Failed to get positions by ids", error as Error, { ids });
      this.config.events?.onError?.("getPositionsByIds", error as Error);
      return [];
    }
  }

  async searchPositions(searchTerm: string): Promise<EndgamePosition[]> {
    try {
      // Firestore doesn't support full-text search natively
      // For production, consider Algolia or Elasticsearch
      const positions = await this.getAllPositions();
      const lowerSearch = searchTerm.toLowerCase();

      const results = positions.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerSearch) ||
          p.description.toLowerCase().includes(lowerSearch),
      );

      this.config.events?.onDataFetched?.("searchPositions", results.length);
      return results;
    } catch (error) {
      logger.error("Failed to search positions", error as Error, {
        searchTerm,
      });
      this.config.events?.onError?.("searchPositions", error as Error);
      return [];
    }
  }

  getPositionsByTags(tags: string[]): Promise<EndgamePosition[]> {
    // Tags are not yet implemented in EndgamePosition type
    // Return empty array for now
    logger.warn(
      "getPositionsByTags: tags property not yet implemented in EndgamePosition",
      { tags }
    );
    this.config.events?.onDataFetched?.("getPositionsByTags", 0);
    return Promise.resolve([]);
  }

  async getNextPosition(
    currentId: number,
    categoryId?: string,
  ): Promise<EndgamePosition | null> {
    try {
      const positionsRef = collection(this.db, "positions");
      let q: Query<DocumentData>;

      if (categoryId) {
        q = query(
          positionsRef,
          where("category", "==", categoryId),
          where("id", ">", currentId),
          orderBy("id"),
          limit(1),
        );
      } else {
        q = query(
          positionsRef,
          where("id", ">", currentId),
          orderBy("id"),
          limit(1),
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const firstDoc = snapshot.docs[0];
      if (!firstDoc) {
        logger.error("No document found in snapshot");
        return null;
      }
      const data = firstDoc.data();
      const position: EndgamePosition = {
        ...data,
        id: parseInt(firstDoc.id),
      } as EndgamePosition;

      // Validate FEN
      if (position.fen) {
        const validation = validateAndSanitizeFen(position.fen);
        if (!validation.isValid) {
          logger.error(
            `Invalid FEN for position ${position.id}: ${validation.errors.join(", ")}`,
          );
          return null;
        }
        position.fen = validation.sanitized;
      }

      this.config.events?.onDataFetched?.("getNextPosition", 1);
      return position;
    } catch (error) {
      logger.error("Failed to get next position", error as Error, {
        currentId,
        categoryId,
      });
      this.config.events?.onError?.("getNextPosition", error as Error);
      return null;
    }
  }

  async getPreviousPosition(
    currentId: number,
    categoryId?: string,
  ): Promise<EndgamePosition | null> {
    try {
      const positionsRef = collection(this.db, "positions");
      let q: Query<DocumentData>;

      if (categoryId) {
        q = query(
          positionsRef,
          where("category", "==", categoryId),
          where("id", "<", currentId),
          orderBy("id", "desc"),
          limit(1),
        );
      } else {
        q = query(
          positionsRef,
          where("id", "<", currentId),
          orderBy("id", "desc"),
          limit(1),
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const firstDoc = snapshot.docs[0];
      if (!firstDoc) {
        logger.error("No document found in snapshot");
        return null;
      }
      const data = firstDoc.data();
      const position: EndgamePosition = {
        ...data,
        id: parseInt(firstDoc.id),
      } as EndgamePosition;

      // Validate FEN
      if (position.fen) {
        const validation = validateAndSanitizeFen(position.fen);
        if (!validation.isValid) {
          logger.error(
            `Invalid FEN for position ${position.id}: ${validation.errors.join(", ")}`,
          );
          return null;
        }
        position.fen = validation.sanitized;
      }

      this.config.events?.onDataFetched?.("getPreviousPosition", 1);
      return position;
    } catch (error) {
      logger.error("Failed to get previous position", error as Error, {
        currentId,
        categoryId,
      });
      this.config.events?.onError?.("getPreviousPosition", error as Error);
      return null;
    }
  }

  async getCategories(): Promise<EndgameCategory[]> {
    try {
      const categoriesRef = collection(this.db, "categories");
      const snapshot = await getDocs(categoriesRef);

      const categories: EndgameCategory[] = [];
      snapshot.forEach((doc) => {
        categories.push(doc.data() as EndgameCategory);
      });

      this.config.events?.onDataFetched?.("getCategories", categories.length);
      return categories;
    } catch (error) {
      logger.error("Failed to get categories", error as Error);
      this.config.events?.onError?.("getCategories", error as Error);
      return [];
    }
  }

  async getCategory(id: string): Promise<EndgameCategory | null> {
    try {
      const docRef = doc(this.db, "categories", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        this.config.events?.onDataFetched?.("getCategory", 1);
        return docSnap.data() as EndgameCategory;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get category", error as Error, { id });
      this.config.events?.onError?.("getCategory", error as Error);
      return null;
    }
  }

  async getChapters(): Promise<EndgameChapter[]> {
    try {
      const chaptersRef = collection(this.db, "chapters");
      const snapshot = await getDocs(chaptersRef);

      const chapters: EndgameChapter[] = [];
      snapshot.forEach((doc) => {
        chapters.push(doc.data() as EndgameChapter);
      });

      this.config.events?.onDataFetched?.("getChapters", chapters.length);
      return chapters;
    } catch (error) {
      logger.error("Failed to get chapters", error as Error);
      this.config.events?.onError?.("getChapters", error as Error);
      return [];
    }
  }

  async getChaptersByCategory(categoryId: string): Promise<EndgameChapter[]> {
    try {
      const chaptersRef = collection(this.db, "chapters");
      const q = query(chaptersRef, where("category", "==", categoryId));
      const snapshot = await getDocs(q);

      const chapters: EndgameChapter[] = [];
      snapshot.forEach((doc) => {
        chapters.push(doc.data() as EndgameChapter);
      });

      this.config.events?.onDataFetched?.(
        "getChaptersByCategory",
        chapters.length,
      );
      return chapters;
    } catch (error) {
      logger.error("Failed to get chapters by category", error as Error, {
        categoryId,
      });
      this.config.events?.onError?.("getChaptersByCategory", error as Error);
      return [];
    }
  }

  async getTotalPositionCount(): Promise<number> {
    try {
      const positionsRef = collection(this.db, "positions");
      const snapshot = await getDocs(positionsRef);

      const count = snapshot.size;
      this.config.events?.onDataFetched?.("getTotalPositionCount", count);

      return count;
    } catch (error) {
      logger.error("Failed to get total position count", error as Error);
      this.config.events?.onError?.("getTotalPositionCount", error as Error);
      return 0;
    }
  }

  async getPositionCountByCategory(categoryId: string): Promise<number> {
    try {
      const positionsRef = collection(this.db, "positions");
      const q = query(positionsRef, where("category", "==", categoryId));
      const snapshot = await getDocs(q);

      const count = snapshot.size;
      this.config.events?.onDataFetched?.("getPositionCountByCategory", count);

      return count;
    } catch (error) {
      logger.error("Failed to get position count by category", error as Error, {
        categoryId,
      });
      this.config.events?.onError?.(
        "getPositionCountByCategory",
        error as Error,
      );
      return 0;
    }
  }

  async getPositionCountByDifficulty(
    difficulty: EndgamePosition["difficulty"],
  ): Promise<number> {
    try {
      const positionsRef = collection(this.db, "positions");
      const q = query(positionsRef, where("difficulty", "==", difficulty));
      const snapshot = await getDocs(q);

      const count = snapshot.size;
      this.config.events?.onDataFetched?.(
        "getPositionCountByDifficulty",
        count,
      );

      return count;
    } catch (error) {
      logger.error(
        "Failed to get position count by difficulty",
        error as Error,
        { difficulty },
      );
      this.config.events?.onError?.(
        "getPositionCountByDifficulty",
        error as Error,
      );
      return 0;
    }
  }

  async batchCreatePositions(
    positions: Omit<EndgamePosition, "id">[],
  ): Promise<EndgamePosition[]> {
    try {
      const batch = writeBatch(this.db);
      const createdPositions: EndgamePosition[] = [];

      for (const data of positions) {
        // Generate unique ID using crypto.randomUUID for each position
        const uniqueId = crypto.randomUUID();
        const id = Math.abs(
          uniqueId.split("").reduce((acc, char) => {
            const hash = (acc << 5) - acc + char.charCodeAt(0);
            return hash & hash;
          }, 0),
        );
        const position: EndgamePosition = { ...data, id };

        // Validate FEN
        if (position.fen) {
          const validation = validateAndSanitizeFen(position.fen);
          if (!validation.isValid) {
            throw new Error(
              `Invalid FEN for position: ${validation.errors.join(", ")}`,
            );
          }
          position.fen = validation.sanitized;
        }

        const docRef = doc(this.db, "positions", id.toString());
        batch.set(docRef, position);
        createdPositions.push(position);
      }

      await batch.commit();

      const ids = createdPositions.map((p) => p.id);
      this.config.events?.onDataModified?.("batchCreatePositions", ids);

      return createdPositions;
    } catch (error) {
      logger.error("Failed to batch create positions", error as Error);
      this.config.events?.onError?.("batchCreatePositions", error as Error);
      throw error;
    }
  }

  async batchUpdatePositions(
    updates: Array<{ id: number; updates: Partial<EndgamePosition> }>,
  ): Promise<EndgamePosition[]> {
    try {
      const batch = writeBatch(this.db);
      const ids: number[] = [];

      for (const { id, updates: updateData } of updates) {
        // Validate FEN if provided
        if (updateData.fen) {
          const validation = validateAndSanitizeFen(updateData.fen);
          if (!validation.isValid) {
            throw new Error(
              `Invalid FEN for position ${id}: ${validation.errors.join(", ")}`,
            );
          }
          updateData.fen = validation.sanitized;
        }

        const docRef = doc(this.db, "positions", id.toString());
        batch.update(docRef, updateData as DocumentData);
        ids.push(id);
      }

      await batch.commit();

      this.config.events?.onDataModified?.("batchUpdatePositions", ids);
      return this.getPositionsByIds(ids);
    } catch (error) {
      logger.error("Failed to batch update positions", error as Error);
      this.config.events?.onError?.("batchUpdatePositions", error as Error);
      throw error;
    }
  }

  async batchDeletePositions(ids: number[]): Promise<boolean> {
    try {
      const batch = writeBatch(this.db);

      for (const id of ids) {
        const docRef = doc(this.db, "positions", id.toString());
        batch.delete(docRef);
      }

      await batch.commit();

      this.config.events?.onDataModified?.("batchDeletePositions", ids);
      return true;
    } catch (error) {
      logger.error("Failed to batch delete positions", error as Error, { ids });
      this.config.events?.onError?.("batchDeletePositions", error as Error);
      return false;
    }
  }
}
