// Fix for ChessService.unit.test.ts
// The issue: ChessService module exports a singleton that creates Chess instance before mocks are set up
// Solution: Move the mock setup to the top of the file before any imports

const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, 'src/tests/unit/services/ChessService.unit.test.ts');
let content = fs.readFileSync(testFile, 'utf8');

// The fix: Move jest.mock() to the very top, before imports
const fixedContent = `/**
 * ChessService Unit Tests - Issue #85 Phase 1
 *
 * Focus: Unit testing with mocked chess.js (70% of total test strategy)
 * Target: >90% coverage for move() and validateMove() methods
 * Strategy: Mock chess.js to test ChessService orchestration logic
 */

// Mock chess.js BEFORE any imports that might use it
// This must come before ChessService import to prevent singleton initialization with real Chess
jest.mock("chess.js");

import { ChessService } from "@shared/services/ChessService";
import { StandardPositions, EndgamePositions } from "../../fixtures/commonFens";
import {
  createMockListener,
  createMockListeners,
  getLastEmittedEvent,
  isValidStateUpdateEvent,
  isValidErrorEvent,
  createTestMove,
} from "../../helpers/chessTestHelpers";
import { Chess } from "chess.js";

const MockedChess = Chess as jest.MockedClass<typeof Chess>;

describe("ChessService Unit Tests", () => {
  let chessService: ChessService;
  let mockChessInstance: jest.Mocked<InstanceType<typeof Chess>>;

  beforeEach(() => {
    MockedChess.mockClear();

    // Create comprehensive mock Chess instance
    mockChessInstance = {
      move: jest.fn(),
      fen: jest.fn().mockReturnValue(StandardPositions.STARTING),
      pgn: jest.fn().mockReturnValue(""),
      history: jest.fn().mockReturnValue([]),
      load: jest.fn(),
      isGameOver: jest.fn().mockReturnValue(false),
      turn: jest.fn().mockReturnValue("w"),
      moves: jest.fn().mockReturnValue(["e4", "e3", "Nf3"]),
      isCheck: jest.fn().mockReturnValue(false),
      isCheckmate: jest.fn().mockReturnValue(false),
      isStalemate: jest.fn().mockReturnValue(false),
      isDraw: jest.fn().mockReturnValue(false),
      isThreefoldRepetition: jest.fn().mockReturnValue(false),
      isInsufficientMaterial: jest.fn().mockReturnValue(false),
    } as any;

    MockedChess.mockImplementation(() => mockChessInstance);
    chessService = new ChessService();
  });`;

// Find where the tests actually start (after imports and mock setup)
const testStartIndex = content.indexOf('describe("ChessService Unit Tests"');
if (testStartIndex !== -1) {
  // Get the rest of the tests (everything after the describe)
  const testsContent = content.substring(testStartIndex);
  
  // Combine the fixed header with the tests
  content = fixedContent + '\n' + testsContent.substring(testsContent.indexOf('\n'));
  
  fs.writeFileSync(testFile, content, 'utf8');
  console.log('Fixed ChessService.unit.test.ts - moved jest.mock() before imports');
} else {
  console.error('Could not find test structure to fix');
}