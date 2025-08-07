/**
 * Mock for serverPositionService
 * Used in tests to simulate position navigation without database calls
 */

import { IPositionService } from "../IPositionService";
import { EndgamePosition } from "@shared/types";

// Mock implementation of IPositionService for tests
const mockPositionService: IPositionService = {
  // Single position operations
  getPosition: jest.fn().mockResolvedValue(null),
  createPosition: jest.fn().mockResolvedValue(null),
  updatePosition: jest.fn().mockResolvedValue(null),
  deletePosition: jest.fn().mockResolvedValue(false),

  // Bulk position operations
  getAllPositions: jest.fn().mockResolvedValue([]),
  getPositionsByCategory: jest.fn().mockResolvedValue([]),
  getPositionsByDifficulty: jest.fn().mockResolvedValue([]),

  // Search and filtering
  searchPositions: jest.fn().mockResolvedValue([]),

  // Navigation - Return null by default (no next/previous positions)
  getNextPosition: jest.fn().mockResolvedValue(null),
  getPreviousPosition: jest.fn().mockResolvedValue(null),

  // Categories and chapters
  getCategories: jest.fn().mockResolvedValue([]),
  getChapters: jest.fn().mockResolvedValue([]),
  getChaptersByCategory: jest.fn().mockResolvedValue([]),

  // Statistics
  getTotalPositionCount: jest.fn().mockResolvedValue(0),
  getPositionCountByCategory: jest.fn().mockResolvedValue(0),

  // Cache management
  clearCache: jest.fn(),
  getCacheStats: jest.fn().mockReturnValue({ size: 0, keys: [], enabled: false }),
};

// Export the factory functions that are used in the actual code
export const createServerPositionService = jest.fn(() => mockPositionService);
export const getServerPositionService = jest.fn(() => mockPositionService);
export const resetServerPositionService = jest.fn();

// Export the mock service for test access
export const mockServerPositionService = mockPositionService;