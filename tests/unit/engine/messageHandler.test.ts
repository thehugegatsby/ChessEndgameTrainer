/**
 * @fileoverview Unit tests for StockfishMessageHandler
 * @version 1.0.0
 * @description Tests UCI protocol parsing, response handling, and error processing
 * Following test guidelines from docs/testing/TESTING_GUIDELINES.md
 */

import { StockfishMessageHandler } from '../../../shared/lib/chess/engine/messageHandler';
import type { 
  EngineRequest, 
  BestMoveRequest, 
  EvaluationRequest,
  BestMoveResponse,
  EvaluationResponse,
  ErrorResponse
} from '../../../shared/lib/chess/engine/types';
import { Chess } from 'chess.js';

// Mock chess.js
jest.mock('chess.js');

// Mock logger
jest.mock('../../../shared/services/logging', () => ({
  getLogger: () => require('../../shared/logger-utils').createTestLogger()
}));

// Helper function to create a mock Move object
const createMockMove = (from: string, to: string, piece: string = 'p', color: string = 'w') => ({
  from: from as any,
  to: to as any,
  san: to,
  lan: `${from}${to}`,
  flags: '',
  piece: piece as any,
  color: color as any,
  before: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  captured: undefined,
  promotion: undefined,
  isCapture: () => false,
  isPromotion: () => false,
  isEnPassant: () => false,
  isKingsideCastle: () => false,
  isQueensideCastle: () => false,
  isBigPawn: () => piece === 'p'
});

describe('StockfishMessageHandler', () => {
  let handler: StockfishMessageHandler;
  let mockChess: jest.Mocked<Chess>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup chess.js mock
    mockChess = new Chess() as jest.Mocked<Chess>;
    (Chess as jest.Mock).mockImplementation(() => mockChess);
    
    // Default mock implementations
    mockChess.load = jest.fn();
    mockChess.move = jest.fn();
    
    // Create new handler instance
    handler = new StockfishMessageHandler();
  });

  describe('UCI protocol handling', () => {
    it('should recognize uciok message and return ready response', () => {
      const response = handler.handleMessage('uciok');
      
      expect(response).toEqual({ type: 'ready' });
      expect(handler.isUciReady()).toBe(true);
    });

    it('should recognize readyok message and return ready response', () => {
      const response = handler.handleMessage('readyok');
      
      expect(response).toEqual({ type: 'ready' });
    });

    it('should handle messages with extra whitespace', () => {
      const response = handler.handleMessage('  uciok  \n');
      
      expect(response).toEqual({ type: 'ready' });
    });

    it('should return null for unrecognized messages', () => {
      const response = handler.handleMessage('info string Stockfish 15');
      
      expect(response).toBeNull();
    });
  });

  describe('best move handling', () => {
    const mockRequest: BestMoveRequest = {
      id: 'test-123',
      type: 'bestmove',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      timeLimit: 2000
    };

    beforeEach(() => {
      handler.setCurrentRequest(mockRequest);
    });

    it('should parse valid best move response', () => {
      const mockMove = createMockMove('e2', 'e4', 'p', 'w');
      mockChess.move.mockReturnValue(mockMove);
      
      const response = handler.handleMessage('bestmove e2e4') as BestMoveResponse;
      
      expect(response).toEqual({
        id: 'test-123',
        type: 'bestmove',
        move: mockMove
      });
      expect(mockChess.load).toHaveBeenCalledWith(mockRequest.fen);
      expect(mockChess.move).toHaveBeenCalledWith('e2e4');
    });

    it('should handle (none) move response', () => {
      const response = handler.handleMessage('bestmove (none)') as BestMoveResponse;
      
      expect(response).toEqual({
        id: 'test-123',
        type: 'bestmove',
        move: null
      });
    });

    it('should handle invalid move gracefully', () => {
      mockChess.move.mockImplementation(() => {
        throw new Error('Invalid move');
      });
      
      const response = handler.handleMessage('bestmove invalid') as BestMoveResponse;
      
      expect(response).toEqual({
        id: 'test-123',
        type: 'bestmove',
        move: null
      });
    });

    it('should return null if no active request', () => {
      handler.clearCurrentRequest();
      
      const response = handler.handleMessage('bestmove e2e4');
      
      expect(response).toBeNull();
    });

    it('should clear request after processing bestmove', () => {
      handler.handleMessage('bestmove e2e4');
      
      // Try to process another bestmove
      const response = handler.handleMessage('bestmove d2d4');
      
      expect(response).toBeNull();
    });
  });

  describe('evaluation handling', () => {
    const mockRequest: EvaluationRequest = {
      id: 'eval-456',
      type: 'evaluation',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      timeLimit: 2000
    };

    beforeEach(() => {
      handler.setCurrentRequest(mockRequest);
    });

    it('should accumulate evaluation info and return on bestmove', () => {
      // First, send evaluation info
      let response = handler.handleMessage('info depth 20 score cp 50 nodes 123456 time 1500');
      expect(response).toBeNull(); // Should accumulate, not return yet
      
      // Then bestmove triggers the response
      response = handler.handleMessage('bestmove e2e4') as EvaluationResponse;
      
      expect(response).toEqual({
        id: 'eval-456',
        type: 'evaluation',
        evaluation: {
          score: 50,
          mate: null,
          depth: 20,
          nodes: 123456,
          time: 1500
        }
      });
    });

    it('should handle mate scores correctly', () => {
      handler.handleMessage('info depth 15 score mate 3');
      const response = handler.handleMessage('bestmove e2e4') as EvaluationResponse;
      
      expect(response.evaluation).toEqual({
        score: 10000,
        mate: 3,
        depth: 15,
        nodes: undefined,
        time: undefined
      });
    });

    it('should handle negative mate scores', () => {
      handler.handleMessage('info depth 10 score mate -2');
      const response = handler.handleMessage('bestmove e2e4') as EvaluationResponse;
      
      expect(response.evaluation).toEqual({
        score: -10000,
        mate: -2,
        depth: 10,
        nodes: undefined,
        time: undefined
      });
    });

    it('should use latest evaluation info when multiple messages received', () => {
      handler.handleMessage('info depth 10 score cp 30');
      handler.handleMessage('info depth 15 score cp 45');
      handler.handleMessage('info depth 20 score cp 50');
      
      const response = handler.handleMessage('bestmove e2e4') as EvaluationResponse;
      
      expect(response.evaluation.score).toBe(50);
      expect(response.evaluation.depth).toBe(20);
    });

    it('should provide default evaluation if no info received', () => {
      const response = handler.handleMessage('bestmove e2e4') as EvaluationResponse;
      
      expect(response.evaluation).toEqual({
        score: 0,
        mate: null
      });
    });

    it('should ignore evaluation info when request type is bestmove', () => {
      const bestMoveRequest: BestMoveRequest = {
        id: 'best-789',
        type: 'bestmove',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 2000
      };
      handler.setCurrentRequest(bestMoveRequest);
      
      // Send evaluation info
      const infoResponse = handler.handleMessage('info depth 20 score cp 50');
      expect(infoResponse).toBeNull();
      
      // Bestmove should return move, not evaluation
      mockChess.move.mockReturnValue(createMockMove('e2', 'e4', 'p', 'w'));
      const response = handler.handleMessage('bestmove e2e4');
      
      expect(response?.type).toBe('bestmove');
    });
  });

  describe('error handling', () => {
    it('should return error response when message processing fails with active request', () => {
      const request: EngineRequest = {
        id: 'error-123',
        type: 'evaluation',
        fen: 'invalid',
        timeLimit: 1000
      };
      handler.setCurrentRequest(request);
      
      // Mock handleMessage to throw
      jest.spyOn(handler as any, 'handleBestMove').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const response = handler.handleMessage('bestmove e2e4') as ErrorResponse;
      
      expect(response).toEqual({
        id: 'error-123',
        type: 'error',
        error: 'Failed to process message: Error: Test error'
      });
    });

    it('should return null when error occurs without active request', () => {
      // Force an error by mocking internal method
      jest.spyOn(String.prototype, 'trim').mockImplementationOnce(() => {
        throw new Error('Trim error');
      });
      
      const response = handler.handleMessage('test message');
      
      expect(response).toBeNull();
    });
  });

  describe('request management', () => {
    it('should track current request state', () => {
      const request: EngineRequest = {
        id: 'track-123',
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 2000
      };
      
      expect(handler.getStats().hasCurrentRequest).toBe(false);
      
      handler.setCurrentRequest(request);
      expect(handler.getStats().hasCurrentRequest).toBe(true);
      
      handler.clearCurrentRequest();
      expect(handler.getStats().hasCurrentRequest).toBe(false);
    });

    it('should clear evaluation when setting new request', () => {
      const request1: EvaluationRequest = {
        id: 'req-1',
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 2000
      };
      
      handler.setCurrentRequest(request1);
      handler.handleMessage('info depth 10 score cp 30');
      
      const request2: EvaluationRequest = {
        id: 'req-2',
        type: 'evaluation',
        fen: 'r1bqkbnr/pppppppp/2n5/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 1 2',
        timeLimit: 2000
      };
      
      handler.setCurrentRequest(request2);
      
      // Should get default evaluation, not the previous one
      const response = handler.handleMessage('bestmove e2e4') as EvaluationResponse;
      expect(response.evaluation.score).toBe(0);
    });
  });

  describe('statistics and debugging', () => {
    it('should track message count', () => {
      expect(handler.getStats().messagesProcessed).toBe(0);
      
      handler.handleMessage('uciok');
      handler.handleMessage('readyok');
      handler.handleMessage('info depth 10');
      
      expect(handler.getStats().messagesProcessed).toBe(3);
    });

    it('should track UCI ready state', () => {
      expect(handler.isUciReady()).toBe(false);
      
      handler.handleMessage('uciok');
      
      expect(handler.isUciReady()).toBe(true);
    });
  });

  describe('edge cases and complex scenarios', () => {
    it('should handle malformed evaluation info gracefully', () => {
      const request: EvaluationRequest = {
        id: 'edge-123',
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 2000
      };
      handler.setCurrentRequest(request);
      
      // Send malformed info
      handler.handleMessage('info depth abc score cp xyz');
      
      const response = handler.handleMessage('bestmove e2e4') as EvaluationResponse;
      
      // Should use default evaluation
      expect(response.evaluation).toEqual({
        score: 0,
        mate: null
      });
    });

    it('should handle multiple score types in same message', () => {
      const request: EvaluationRequest = {
        id: 'multi-123',
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 2000
      };
      handler.setCurrentRequest(request);
      
      // Message with both cp and mate (mate should take precedence)
      handler.handleMessage('info depth 20 score cp 100 score mate 5');
      
      const response = handler.handleMessage('bestmove e2e4') as EvaluationResponse;
      
      expect(response.evaluation.mate).toBe(5);
      expect(response.evaluation.score).toBe(10000);
    });

    it('should handle bestmove with ponder move', () => {
      const request: BestMoveRequest = {
        id: 'ponder-123',
        type: 'bestmove',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 2000
      };
      handler.setCurrentRequest(request);
      
      mockChess.move.mockReturnValue(createMockMove('e2', 'e4', 'p', 'w'));
      
      const response = handler.handleMessage('bestmove e2e4 ponder e7e5') as BestMoveResponse;
      
      expect(response.move).toBeDefined();
      expect(mockChess.move).toHaveBeenCalledWith('e2e4');
    });
  });
});