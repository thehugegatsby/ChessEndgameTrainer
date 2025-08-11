/**
 * TablebaseService Mock for Testing
 * Provides mocked Lichess Tablebase API responses
 */

import {
  type TablebaseEvaluation,
  type TablebaseMove,
  type TablebaseResult,
} from "@shared/types/tablebase";

export /**
 *
 */
const mockTablebaseResult: TablebaseResult = {
  wdl: 2, // win
  dtz: 10,
  dtm: 5,
  category: "win",
  precise: true,
  evaluation: "Matt in 5 Zügen",
};

export /**
 *
 */
const mockTablebaseEvaluation: TablebaseEvaluation = {
  isAvailable: true,
  result: mockTablebaseResult,
};

export /**
 *
 */
const mockTablebaseMove: TablebaseMove = {
  uci: "e2e3",
  san: "Ke3",
  wdl: 2, // win
  dtz: 8,
  dtm: 4,
  category: "win",
};

export /**
 *
 */
const mockTablebaseService = {
  getEvaluation: jest.fn().mockResolvedValue(mockTablebaseEvaluation),
  getTopMoves: jest.fn().mockResolvedValue({
    isAvailable: true,
    moves: [mockTablebaseMove],
  }),
  clearCache: jest.fn(),
  getCacheStats: jest.fn().mockReturnValue({
    size: 0,
    maxSize: 200,
    hits: 0,
    misses: 0,
  }),
};

// Mock the TablebaseService module
jest.mock("@shared/services/TablebaseService", () => ({
  TablebaseService: jest.fn(() => mockTablebaseService),
  default: mockTablebaseService,
}));

export default mockTablebaseService;
