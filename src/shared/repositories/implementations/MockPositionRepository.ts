/**
 * Mock implementation of IPositionRepository for testing
 * Provides in-memory storage with full interface compliance
 */

import {
  type PositionRepository,
  type PositionRepositoryConfig,
} from "../IPositionRepository";
import { getLogger } from "@shared/services/logging";

const logger = getLogger().setContext("MockPositionRepository");
import {
  type EndgamePosition,
  type EndgameCategory,
  type EndgameChapter,
} from "@shared/types";

export class MockPositionRepository implements PositionRepository {
  private positions: Map<number, EndgamePosition> = new Map();
  private categories: Map<string, EndgameCategory> = new Map();
  private chapters: Map<string, EndgameChapter> = new Map();
  private config: PositionRepositoryConfig;
  private nextId: number = 1;

  constructor(config: PositionRepositoryConfig = {}) {
    this.config = config;
  }

  // Test helper methods
  reset(): void {
    this.positions.clear();
    this.categories.clear();
    this.chapters.clear();
    this.nextId = 1;
  }

  seedData(data: {
    positions?: EndgamePosition[];
    categories?: EndgameCategory[];
    chapters?: EndgameChapter[];
  }): void {
    if (data.positions) {
      data.positions.forEach((p) => this.positions.set(p.id, p));
    }
    if (data.categories) {
      data.categories.forEach((c) => this.categories.set(c.id, c));
    }
    if (data.chapters) {
      data.chapters.forEach((c) => this.chapters.set(c.id, c));
    }
  }

  // PositionRepository implementation
  getPosition(id: number): Promise<EndgamePosition | null> {
    const position = this.positions.get(id) || null;
    if (position) {
      this.config.events?.onDataFetched?.("getPosition", 1);
    }
    return Promise.resolve(position);
  }

  createPosition(
    data: Omit<EndgamePosition, "id">,
  ): Promise<EndgamePosition> {
    const id = this.nextId++;
    const position: EndgamePosition = { ...data, id };
    this.positions.set(id, position);

    this.config.events?.onDataModified?.("createPosition", [id]);
    return Promise.resolve(position);
  }

  updatePosition(
    id: number,
    updates: Partial<EndgamePosition>,
  ): Promise<EndgamePosition | null> {
    const position = this.positions.get(id);
    if (!position) return Promise.resolve(null);

    const updated = { ...position, ...updates };
    this.positions.set(id, updated);

    this.config.events?.onDataModified?.("updatePosition", [id]);
    return Promise.resolve(updated);
  }

  deletePosition(id: number): Promise<boolean> {
    const deleted = this.positions.delete(id);
    if (deleted) {
      this.config.events?.onDataModified?.("deletePosition", [id]);
    }
    return Promise.resolve(deleted);
  }

  getAllPositions(): Promise<EndgamePosition[]> {
    const positions = Array.from(this.positions.values());
    this.config.events?.onDataFetched?.("getAllPositions", positions.length);
    return Promise.resolve(positions);
  }

  getPositionsByCategory(category: string): Promise<EndgamePosition[]> {
    const positions = Array.from(this.positions.values()).filter(
      (p) => p.category === category,
    );
    this.config.events?.onDataFetched?.(
      "getPositionsByCategory",
      positions.length,
    );
    return Promise.resolve(positions);
  }

  getPositionsByDifficulty(
    difficulty: EndgamePosition["difficulty"],
  ): Promise<EndgamePosition[]> {
    const positions = Array.from(this.positions.values()).filter(
      (p) => p.difficulty === difficulty,
    );
    this.config.events?.onDataFetched?.(
      "getPositionsByDifficulty",
      positions.length,
    );
    return Promise.resolve(positions);
  }

  getPositionsByIds(ids: number[]): Promise<EndgamePosition[]> {
    const positions = ids
      .map((id) => this.positions.get(id))
      .filter((p): p is EndgamePosition => p !== undefined);
    this.config.events?.onDataFetched?.("getPositionsByIds", positions.length);
    return Promise.resolve(positions);
  }

  searchPositions(searchTerm: string): Promise<EndgamePosition[]> {
    const lowerSearch = searchTerm.toLowerCase();
    const positions = Array.from(this.positions.values()).filter(
      (p) =>
        p.title.toLowerCase().includes(lowerSearch) ||
        p.description.toLowerCase().includes(lowerSearch),
    );
    this.config.events?.onDataFetched?.("searchPositions", positions.length);
    return Promise.resolve(positions);
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

  getNextPosition(
    currentId: number,
    categoryId?: string,
  ): Promise<EndgamePosition | null> {
    let positions = Array.from(this.positions.values());

    if (categoryId) {
      positions = positions.filter((p) => p.category === categoryId);
    }

    positions = positions.filter((p) => p.id > currentId);
    positions.sort((a, b) => a.id - b.id);

    const next = positions[0] || null;
    if (next) {
      this.config.events?.onDataFetched?.("getNextPosition", 1);
    }

    return Promise.resolve(next);
  }

  getPreviousPosition(
    currentId: number,
    categoryId?: string,
  ): Promise<EndgamePosition | null> {
    let positions = Array.from(this.positions.values());

    if (categoryId) {
      positions = positions.filter((p) => p.category === categoryId);
    }

    positions = positions.filter((p) => p.id < currentId);
    positions.sort((a, b) => b.id - a.id);

    const previous = positions[0] || null;
    if (previous) {
      this.config.events?.onDataFetched?.("getPreviousPosition", 1);
    }

    return Promise.resolve(previous);
  }

  getCategories(): Promise<EndgameCategory[]> {
    const categories = Array.from(this.categories.values());
    this.config.events?.onDataFetched?.("getCategories", categories.length);
    return Promise.resolve(categories);
  }

  getCategory(id: string): Promise<EndgameCategory | null> {
    const category = this.categories.get(id) || null;
    if (category) {
      this.config.events?.onDataFetched?.("getCategory", 1);
    }
    return Promise.resolve(category);
  }

  getChapters(): Promise<EndgameChapter[]> {
    const chapters = Array.from(this.chapters.values());
    this.config.events?.onDataFetched?.("getChapters", chapters.length);
    return Promise.resolve(chapters);
  }

  getChaptersByCategory(categoryId: string): Promise<EndgameChapter[]> {
    const chapters = Array.from(this.chapters.values()).filter(
      (c) => c.category === categoryId,
    );
    this.config.events?.onDataFetched?.(
      "getChaptersByCategory",
      chapters.length,
    );
    return Promise.resolve(chapters);
  }

  getTotalPositionCount(): Promise<number> {
    const count = this.positions.size;
    this.config.events?.onDataFetched?.("getTotalPositionCount", count);
    return Promise.resolve(count);
  }

  getPositionCountByCategory(categoryId: string): Promise<number> {
    const count = Array.from(this.positions.values()).filter(
      (p) => p.category === categoryId,
    ).length;
    this.config.events?.onDataFetched?.("getPositionCountByCategory", count);
    return Promise.resolve(count);
  }

  getPositionCountByDifficulty(
    difficulty: EndgamePosition["difficulty"],
  ): Promise<number> {
    const count = Array.from(this.positions.values()).filter(
      (p) => p.difficulty === difficulty,
    ).length;
    this.config.events?.onDataFetched?.("getPositionCountByDifficulty", count);
    return Promise.resolve(count);
  }

  batchCreatePositions(
    positions: Omit<EndgamePosition, "id">[],
  ): Promise<EndgamePosition[]> {
    const created: EndgamePosition[] = [];

    for (const data of positions) {
      const id = this.nextId++;
      const position: EndgamePosition = { ...data, id };
      this.positions.set(id, position);
      created.push(position);
    }

    const ids = created.map((p) => p.id);
    this.config.events?.onDataModified?.("batchCreatePositions", ids);

    return Promise.resolve(created);
  }

  batchUpdatePositions(
    updates: Array<{ id: number; updates: Partial<EndgamePosition> }>,
  ): Promise<EndgamePosition[]> {
    const updated: EndgamePosition[] = [];

    for (const { id, updates: updateData } of updates) {
      const position = this.positions.get(id);
      if (position) {
        const updatedPosition = { ...position, ...updateData };
        this.positions.set(id, updatedPosition);
        updated.push(updatedPosition);
      }
    }

    const ids = updated.map((p) => p.id);
    this.config.events?.onDataModified?.("batchUpdatePositions", ids);

    return Promise.resolve(updated);
  }

  batchDeletePositions(ids: number[]): Promise<boolean> {
    let allDeleted = true;

    for (const id of ids) {
      if (!this.positions.delete(id)) {
        allDeleted = false;
      }
    }

    if (allDeleted) {
      this.config.events?.onDataModified?.("batchDeletePositions", ids);
    }

    return Promise.resolve(allDeleted);
  }
}
