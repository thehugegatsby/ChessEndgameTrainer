/**
 * Mock implementation of IPositionRepository for testing
 * Provides in-memory storage with full interface compliance
 */

import {
  IPositionRepository,
  IPositionRepositoryConfig,
} from "../IPositionRepository";
import {
  EndgamePosition,
  EndgameCategory,
  EndgameChapter,
} from "@shared/types";

export class MockPositionRepository implements IPositionRepository {
  private positions: Map<number, EndgamePosition> = new Map();
  private categories: Map<string, EndgameCategory> = new Map();
  private chapters: Map<string, EndgameChapter> = new Map();
  private config: IPositionRepositoryConfig;
  private nextId: number = 1;

  constructor(config: IPositionRepositoryConfig = {}) {
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

  // IPositionRepository implementation
  async getPosition(id: number): Promise<EndgamePosition | null> {
    const position = this.positions.get(id) || null;
    if (position) {
      this.config.events?.onDataFetched?.("getPosition", 1);
    }
    return Promise.resolve(position);
  }

  async createPosition(
    data: Omit<EndgamePosition, "id">,
  ): Promise<EndgamePosition> {
    const id = this.nextId++;
    const position: EndgamePosition = { ...data, id };
    this.positions.set(id, position);

    this.config.events?.onDataModified?.("createPosition", [id]);
    return Promise.resolve(position);
  }

  async updatePosition(
    id: number,
    updates: Partial<EndgamePosition>,
  ): Promise<EndgamePosition | null> {
    const position = this.positions.get(id);
    if (!position) return null;

    const updated = { ...position, ...updates };
    this.positions.set(id, updated);

    this.config.events?.onDataModified?.("updatePosition", [id]);
    return Promise.resolve(updated);
  }

  async deletePosition(id: number): Promise<boolean> {
    const deleted = this.positions.delete(id);
    if (deleted) {
      this.config.events?.onDataModified?.("deletePosition", [id]);
    }
    return Promise.resolve(deleted);
  }

  async getAllPositions(): Promise<EndgamePosition[]> {
    const positions = Array.from(this.positions.values());
    this.config.events?.onDataFetched?.("getAllPositions", positions.length);
    return Promise.resolve(positions);
  }

  async getPositionsByCategory(category: string): Promise<EndgamePosition[]> {
    const positions = Array.from(this.positions.values()).filter(
      (p) => p.category === category,
    );
    this.config.events?.onDataFetched?.(
      "getPositionsByCategory",
      positions.length,
    );
    return Promise.resolve(positions);
  }

  async getPositionsByDifficulty(
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

  async getPositionsByIds(ids: number[]): Promise<EndgamePosition[]> {
    const positions = ids
      .map((id) => this.positions.get(id))
      .filter((p): p is EndgamePosition => p !== undefined);
    this.config.events?.onDataFetched?.("getPositionsByIds", positions.length);
    return Promise.resolve(positions);
  }

  async searchPositions(searchTerm: string): Promise<EndgamePosition[]> {
    const lowerSearch = searchTerm.toLowerCase();
    const positions = Array.from(this.positions.values()).filter(
      (p) =>
        p.title.toLowerCase().includes(lowerSearch) ||
        p.description.toLowerCase().includes(lowerSearch),
    );
    this.config.events?.onDataFetched?.("searchPositions", positions.length);
    return Promise.resolve(positions);
  }

  async getPositionsByTags(_tags: string[]): Promise<EndgamePosition[]> {
    // Tags are not yet implemented in EndgamePosition type
    // Return empty array for now
    console.warn(
      "getPositionsByTags: tags property not yet implemented in EndgamePosition",
    );
    this.config.events?.onDataFetched?.("getPositionsByTags", 0);
    return Promise.resolve([]);
  }

  async getNextPosition(
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

  async getPreviousPosition(
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

  async getCategories(): Promise<EndgameCategory[]> {
    const categories = Array.from(this.categories.values());
    this.config.events?.onDataFetched?.("getCategories", categories.length);
    return Promise.resolve(categories);
  }

  async getCategory(id: string): Promise<EndgameCategory | null> {
    const category = this.categories.get(id) || null;
    if (category) {
      this.config.events?.onDataFetched?.("getCategory", 1);
    }
    return Promise.resolve(category);
  }

  async getChapters(): Promise<EndgameChapter[]> {
    const chapters = Array.from(this.chapters.values());
    this.config.events?.onDataFetched?.("getChapters", chapters.length);
    return Promise.resolve(chapters);
  }

  async getChaptersByCategory(categoryId: string): Promise<EndgameChapter[]> {
    const chapters = Array.from(this.chapters.values()).filter(
      (c) => c.category === categoryId,
    );
    this.config.events?.onDataFetched?.(
      "getChaptersByCategory",
      chapters.length,
    );
    return Promise.resolve(chapters);
  }

  async getTotalPositionCount(): Promise<number> {
    const count = this.positions.size;
    this.config.events?.onDataFetched?.("getTotalPositionCount", count);
    return Promise.resolve(count);
  }

  async getPositionCountByCategory(categoryId: string): Promise<number> {
    const count = Array.from(this.positions.values()).filter(
      (p) => p.category === categoryId,
    ).length;
    this.config.events?.onDataFetched?.("getPositionCountByCategory", count);
    return Promise.resolve(count);
  }

  async getPositionCountByDifficulty(
    difficulty: EndgamePosition["difficulty"],
  ): Promise<number> {
    const count = Array.from(this.positions.values()).filter(
      (p) => p.difficulty === difficulty,
    ).length;
    this.config.events?.onDataFetched?.("getPositionCountByDifficulty", count);
    return Promise.resolve(count);
  }

  async batchCreatePositions(
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

  async batchUpdatePositions(
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

  async batchDeletePositions(ids: number[]): Promise<boolean> {
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
