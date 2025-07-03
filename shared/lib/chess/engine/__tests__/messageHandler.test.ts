import { StockfishMessageHandler } from '../messageHandler';
import type { StockfishWorkerManager } from '../workerManager';
import type { BestMoveRequest, EvaluationRequest } from '../types';
import { Chess } from 'chess.js';

// Mock chess.js
jest.mock('chess.js');

describe('StockfishMessageHandler', () => {
  let handler: StockfishMessageHandler;
  let mockWorkerManager: jest.Mocked<StockfishWorkerManager>;
  let mockChess: jest.Mocked<Chess>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockChess = {
      load: jest.fn(),
      move: jest.fn(),
      fen: jest.fn()
    } as any;
    
    (Chess as jest.MockedClass<typeof Chess>).mockImplementation(() => mockChess);
    
    mockWorkerManager = {
      onRequestComplete: jest.fn(),
      isWorkerReady: jest.fn().mockReturnValue(true),
      sendCommand: jest.fn()
    } as any;
    
    handler = new StockfishMessageHandler();
  });

  describe('Initialization', () => {
    test('should create handler instance', () => {
      expect(handler).toBeDefined();
      expect(handler.isUciReady()).toBe(false);
    });

    test('should set worker manager', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      // Internal reference should be set
      expect((handler as any).workerManager).toBe(mockWorkerManager);
    });
  });

  describe('UCI Protocol', () => {
    test('should handle uciok message', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      handler.handleMessage('uciok');
      
      expect(handler.isUciReady()).toBe(true);
    });

    test('should ignore non-UCI messages before ready', () => {
      handler.handleMessage('info depth 10');
      handler.handleMessage('bestmove e2e4');
      
      expect(handler.isUciReady()).toBe(false);
    });
  });

  describe('Current Request Management', () => {
    test('should set current request', () => {
      const request: BestMoveRequest = {
        type: 'bestmove',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 1000,
        id: 'test-1',
        resolve: jest.fn()
      };
      
      handler.setCurrentRequest(request);
      
      expect((handler as any).currentRequest).toBe(request);
    });

    test('should clear current request', () => {
      const request: BestMoveRequest = {
        type: 'bestmove',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 1000,
        id: 'test-1',
        resolve: jest.fn()
      };
      
      handler.setCurrentRequest(request);
      handler.clearCurrentRequest();
      
      expect((handler as any).currentRequest).toBeNull();
      expect((handler as any).currentEvaluation).toBeNull();
    });
  });

  describe('Best Move Handling', () => {
    test('should handle valid bestmove response', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const resolve = jest.fn();
      const request: BestMoveRequest = {
        type: 'bestmove',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 1000,
        id: 'test-1',
        resolve
      };
      
      mockChess.move.mockReturnValue({
        from: 'e2',
        to: 'e4',
        san: 'e4',
        flags: 'b',
        piece: 'p',
        color: 'w'
      } as any);
      
      handler.setCurrentRequest(request);
      handler.handleMessage('bestmove e2e4');
      
      expect(mockChess.load).toHaveBeenCalledWith(request.fen);
      expect(mockChess.move).toHaveBeenCalledWith('e2e4');
      expect(resolve).toHaveBeenCalledWith({
        from: 'e2',
        to: 'e4',
        san: 'e4',
        flags: 'b',
        piece: 'p',
        color: 'w'
      });
      expect(mockWorkerManager.onRequestComplete).toHaveBeenCalled();
    });

    test('should handle bestmove (none)', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const resolve = jest.fn();
      const request: BestMoveRequest = {
        type: 'bestmove',
        fen: '8/8/8/8/8/8/8/8 w - - 0 1',
        timeLimit: 1000,
        id: 'test-1',
        resolve
      };
      
      handler.setCurrentRequest(request);
      handler.handleMessage('bestmove (none)');
      
      expect(resolve).toHaveBeenCalledWith(null);
      expect(mockWorkerManager.onRequestComplete).toHaveBeenCalled();
    });

    test('should handle invalid move', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const resolve = jest.fn();
      const request: BestMoveRequest = {
        type: 'bestmove',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 1000,
        id: 'test-1',
        resolve
      };
      
      mockChess.move.mockReturnValue(null);
      
      handler.setCurrentRequest(request);
      handler.handleMessage('bestmove invalid');
      
      expect(resolve).toHaveBeenCalledWith(null);
    });

    test('should handle chess.js exceptions', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const resolve = jest.fn();
      const request: BestMoveRequest = {
        type: 'bestmove',
        fen: 'invalid-fen',
        timeLimit: 1000,
        id: 'test-1',
        resolve
      };
      
      mockChess.load.mockImplementation(() => {
        throw new Error('Invalid FEN');
      });
      
      handler.setCurrentRequest(request);
      handler.handleMessage('bestmove e2e4');
      
      expect(resolve).toHaveBeenCalledWith(null);
      expect(mockWorkerManager.onRequestComplete).toHaveBeenCalled();
    });

    test('should ignore bestmove without current request', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      handler.handleMessage('bestmove e2e4');
      
      expect(mockWorkerManager.onRequestComplete).not.toHaveBeenCalled();
    });

    test('should ignore bestmove for evaluation request', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const request: EvaluationRequest = {
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 3000,
        id: 'eval-1',
        resolve: jest.fn()
      };
      
      handler.setCurrentRequest(request);
      handler.handleMessage('bestmove e2e4');
      
      // Should process as end of evaluation
      expect(request.resolve).toHaveBeenCalledWith({ score: 0, mate: null });
    });
  });

  describe('Evaluation Handling', () => {
    test('should handle centipawn evaluation', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const resolve = jest.fn();
      const request: EvaluationRequest = {
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 3000,
        id: 'eval-1',
        resolve
      };
      
      handler.setCurrentRequest(request);
      
      // Process evaluation info
      handler.handleMessage('info depth 10 score cp 42');
      
      // End with bestmove
      handler.handleMessage('bestmove e2e4');
      
      expect(resolve).toHaveBeenCalledWith({ score: 42, mate: null });
    });

    test('should handle mate evaluation', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const resolve = jest.fn();
      const request: EvaluationRequest = {
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 3000,
        id: 'eval-1',
        resolve
      };
      
      handler.setCurrentRequest(request);
      
      // Process mate evaluation
      handler.handleMessage('info depth 15 score mate 3');
      handler.handleMessage('bestmove e2e4');
      
      expect(resolve).toHaveBeenCalledWith({ score: 10000, mate: 3 });
    });

    test('should handle negative mate evaluation', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const resolve = jest.fn();
      const request: EvaluationRequest = {
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 3000,
        id: 'eval-1',
        resolve
      };
      
      handler.setCurrentRequest(request);
      
      handler.handleMessage('info depth 10 score mate -2');
      handler.handleMessage('bestmove e2e4');
      
      expect(resolve).toHaveBeenCalledWith({ score: -10000, mate: -2 });
    });

    test('should update evaluation with latest info', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const resolve = jest.fn();
      const request: EvaluationRequest = {
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 3000,
        id: 'eval-1',
        resolve
      };
      
      handler.setCurrentRequest(request);
      
      // Multiple evaluation updates
      handler.handleMessage('info depth 5 score cp 10');
      handler.handleMessage('info depth 10 score cp 25');
      handler.handleMessage('info depth 15 score cp 42');
      handler.handleMessage('bestmove e2e4');
      
      // Should use latest evaluation
      expect(resolve).toHaveBeenCalledWith({ score: 42, mate: null });
    });

    test('should handle evaluation without score', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const resolve = jest.fn();
      const request: EvaluationRequest = {
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 3000,
        id: 'eval-1',
        resolve
      };
      
      handler.setCurrentRequest(request);
      
      // No score info
      handler.handleMessage('info depth 10 nodes 12345');
      handler.handleMessage('bestmove e2e4');
      
      expect(resolve).toHaveBeenCalledWith({ score: 0, mate: null });
    });
  });

  describe('Message Parsing', () => {
    test('should handle various info message formats', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const request: EvaluationRequest = {
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 3000,
        id: 'eval-1',
        resolve: jest.fn()
      };
      
      handler.setCurrentRequest(request);
      
      // Various formats
      handler.handleMessage('info depth 10 seldepth 15 score cp 42 nodes 12345');
      handler.handleMessage('info score cp -100 depth 8');
      handler.handleMessage('info depth 12 score mate 5 pv e2e4 e7e5');
      
      // Verify last evaluation stored
      expect((handler as any).currentEvaluation).toEqual({ score: 10000, mate: 5 });
    });

    test('should ignore malformed messages', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const request: EvaluationRequest = {
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 3000,
        id: 'eval-1',
        resolve: jest.fn()
      };
      
      handler.setCurrentRequest(request);
      
      // Malformed messages
      handler.handleMessage('info score cp');
      handler.handleMessage('info depth score mate');
      handler.handleMessage('bestmove');
      
      // Should complete with default
      expect(request.resolve).toHaveBeenCalledWith({ score: 0, mate: null });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty messages', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      // Should not throw
      handler.handleMessage('');
      handler.handleMessage('   ');
      handler.handleMessage('\n');
    });

    test('should handle bestmove without worker manager', () => {
      const request: BestMoveRequest = {
        type: 'bestmove',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 1000,
        id: 'test-1',
        resolve: jest.fn()
      };
      
      handler.setCurrentRequest(request);
      
      // Should not throw
      handler.handleMessage('bestmove e2e4');
    });

    test('should handle concurrent evaluation updates', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const request: EvaluationRequest = {
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 3000,
        id: 'eval-1',
        resolve: jest.fn()
      };
      
      handler.setCurrentRequest(request);
      
      // Rapid updates
      for (let i = 1; i <= 20; i++) {
        handler.handleMessage(`info depth ${i} score cp ${i * 10}`);
      }
      
      handler.handleMessage('bestmove e2e4');
      
      // Should have latest value
      expect(request.resolve).toHaveBeenCalledWith({ score: 200, mate: null });
    });

    test('should handle score overflow', () => {
      handler.setWorkerManager(mockWorkerManager);
      
      const request: EvaluationRequest = {
        type: 'evaluation',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        timeLimit: 3000,
        id: 'eval-1',
        resolve: jest.fn()
      };
      
      handler.setCurrentRequest(request);
      
      handler.handleMessage('info depth 10 score cp 999999');
      handler.handleMessage('bestmove e2e4');
      
      expect(request.resolve).toHaveBeenCalledWith({ score: 999999, mate: null });
    });
  });
});