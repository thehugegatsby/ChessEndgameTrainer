/**
 * Mock for serverPositionService
 * Used in tests to simulate position navigation without database calls
 */

import { vi } from 'vitest';
import { type PositionService } from "../IPositionService";

// Mock implementation of PositionService for tests
const mockPositionService: PositionService = {
  // Single position operations
  getPosition: vi.fn().mockResolvedValue(null),
  createPosition: vi.fn().mockResolvedValue(null),
  updatePosition: vi.fn().mockResolvedValue(null),
  deletePosition: vi.fn().mockResolvedValue(false),

  // Bulk position operations
  getAllPositions: vi.fn().mockResolvedValue([]),
  getPositionsByCategory: vi.fn().mockResolvedValue([]),
  getPositionsByDifficulty: vi.fn().mockResolvedValue([]),

  // Search and filtering
  searchPositions: vi.fn().mockResolvedValue([]),

  // Navigation - Return null by default (no next/previous positions)
  getNextPosition: vi.fn().mockResolvedValue(null),
  getPreviousPosition: vi.fn().mockResolvedValue(null),

  // Categories and chapters
  getCategories: vi.fn().mockResolvedValue([]),
  getChapters: vi.fn().mockResolvedValue([]),
  getChaptersByCategory: vi.fn().mockResolvedValue([]),

  // Statistics
  getTotalPositionCount: vi.fn().mockResolvedValue(0),
  getPositionCountByCategory: vi.fn().mockResolvedValue(0),

  // Cache management
  clearCache: vi.fn(),
  getCacheStats: vi.fn().mockReturnValue({ size: 0, keys: [], enabled: false }),
};

// Export the factory functions that are used in the actual code
export const createServerPositionService = vi.fn(() => mockPositionService);
export const getServerPositionService = vi.fn(() => mockPositionService);
export const resetServerPositionService = vi.fn();

// Export the mock service for test access
export const mockServerPositionService = mockPositionService;