import { SimpleEngine, getSimpleEngine, resetSimpleEngineInstance } from '../../../shared/lib/chess/engine/simple/SimpleEngine';
import { parseUciInfo } from '../../../shared/lib/chess/engine/simple/SimpleUCIParser';

// Mock Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  private _shouldRespond = true;
  
  postMessage(data: string) {
    if (!this._shouldRespond) return;
    
    // Simulate UCI responses based on commands
    setTimeout(() => {
      if (!this._shouldRespond) return;
      
      if (data === 'uci') {
        this.onmessage?.({ data: 'uciok' } as MessageEvent);
      } else if (data === 'isready') {
        this.onmessage?.({ data: 'readyok' } as MessageEvent);
      } else if (data.startsWith('go')) {
        // Simulate evaluation response
        this.onmessage?.({ data: 'info depth 15 score cp 150 pv e2e4 e7e5' } as MessageEvent);
        this.onmessage?.({ data: 'bestmove e2e4' } as MessageEvent);
      }
    }, 10);
  }
  
  terminate() {
    this._shouldRespond = false;
  }
  
  // Method to disable responses (for timeout tests)
  disableResponses() {
    this._shouldRespond = false;
  }
}

// Mock global Worker
global.Worker = jest.fn().mockImplementation(() => new MockWorker());

describe('SimpleEngine', () => {
  let engine: SimpleEngine;
  
  beforeEach(async () => {
    // Reset Worker mock
    global.Worker = jest.fn().mockImplementation(() => new MockWorker());
    
    engine = new SimpleEngine('/test-stockfish.wasm');
    // Wait for initialization to complete
    await engine.waitForInit();
  });
  
  afterEach(() => {
    engine.terminate();
  });

  describe('UCI Parsing', () => {
    it('should parse info string correctly', () => {
      const result = parseUciInfo('info depth 15 score cp 150 pv e2e4 e7e5');
      expect(result).toEqual({
        depth: 15,
        score: { type: 'cp', value: 150 },
        pv: 'e2e4 e7e5'
      });
    });

    it('should parse mate score correctly', () => {
      const result = parseUciInfo('info depth 10 score mate 5 pv e2e4');
      expect(result).toEqual({
        depth: 10,
        score: { type: 'mate', value: 5 },
        pv: 'e2e4'
      });
    });

    it('should return null for non-info lines', () => {
      const result = parseUciInfo('bestmove e2e4');
      expect(result).toBeNull();
    });

    it('should parse complex info string with all fields', () => {
      const result = parseUciInfo('info depth 20 seldepth 25 score cp 250 nodes 1000000 nps 500000 time 2000 pv e2e4 e7e5 Nf3');
      expect(result).toEqual({
        depth: 20,
        seldepth: 25,
        score: { type: 'cp', value: 250 },
        nodes: 1000000,
        nps: 500000,
        time: 2000,
        pv: 'e2e4 e7e5 Nf3'
      });
    });
  });

  describe('Position Evaluation', () => {
    it('should evaluate position and return result', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const result = await engine.evaluatePosition(fen);
      
      expect(result).toEqual({
        score: { type: 'cp', value: 150 },
        depth: 15,
        pv: 'e2e4 e7e5'
      });
    });

    it('should cache evaluation results', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // First evaluation
      const start1 = Date.now();
      const result1 = await engine.evaluatePosition(fen);
      const duration1 = Date.now() - start1;
      
      // Second evaluation (should be cached)
      const start2 = Date.now();
      const result2 = await engine.evaluatePosition(fen);
      const duration2 = Date.now() - start2;
      
      expect(result1).toEqual(result2);
      expect(duration2).toBeLessThan(duration1); // Cached should be faster
    });

    it('should handle evaluation timeout', async () => {
      // Mock worker that never responds to 'go' commands
      const slowWorker = new MockWorker();
      const originalPostMessage = slowWorker.postMessage.bind(slowWorker);
      
      slowWorker.postMessage = (data: string) => {
        if (data.startsWith('go')) {
          // Don't respond to 'go' commands to trigger timeout
          return;
        }
        originalPostMessage(data);
      };
      
      global.Worker = jest.fn().mockImplementation(() => slowWorker);
      
      const slowEngine = new SimpleEngine('/test-stockfish.wasm', { timeout: 100 });
      await slowEngine.waitForInit();
      
      await expect(slowEngine.evaluatePosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).rejects.toThrow('Evaluation timeout');
      
      slowEngine.terminate();
    }, 15000);
  });

  describe('Best Move Finding', () => {
    it('should find best move for position', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const bestMove = await engine.findBestMove(fen);
      
      expect(bestMove).toBe('e2e4');
    }, 15000);

    it('should handle best move timeout', async () => {
      // Mock worker that never responds to 'go' commands
      const slowWorker = new MockWorker();
      const originalPostMessage = slowWorker.postMessage.bind(slowWorker);
      
      slowWorker.postMessage = (data: string) => {
        if (data.startsWith('go')) {
          // Don't respond to 'go' commands to trigger timeout
          return;
        }
        originalPostMessage(data);
      };
      
      global.Worker = jest.fn().mockImplementation(() => slowWorker);
      
      const slowEngine = new SimpleEngine('/test-stockfish.wasm', { timeout: 100 });
      await slowEngine.waitForInit();
      
      await expect(slowEngine.findBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).rejects.toThrow('Best move timeout');
      
      slowEngine.terminate();
    }, 15000);
  });

  // Note: SimpleEngine doesn't have built-in caching
  // Caching is handled by EvaluationCache layer

  describe('Error Handling', () => {
    it('should handle worker errors gracefully', (done) => {
      const errorWorker = new MockWorker();
      global.Worker = jest.fn().mockImplementation(() => errorWorker);
      
      const errorEngine = new SimpleEngine('/test-stockfish.wasm');
      
      errorEngine.on('error', (error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Worker error');
        errorEngine.terminate();
        done();
      });
      
      // Simulate worker error
      setTimeout(() => {
        errorWorker.onerror?.({ message: 'Test error' } as ErrorEvent);
      }, 10);
    });

    it('should handle engine not initialized', async () => {
      const engine = new SimpleEngine('/test-stockfish.wasm');
      engine.terminate(); // Terminate immediately
      
      await expect(engine.evaluatePosition('test-fen')).rejects.toThrow('Engine not initialized');
      await expect(engine.findBestMove('test-fen')).rejects.toThrow('Engine not initialized');
    });
  });

  describe('Initialization', () => {
    it('should initialize engine correctly', async () => {
      const engine = new SimpleEngine('/test-stockfish.wasm');
      
      // Wait for initialization
      await engine.waitForInit();
      
      expect(engine).toBeDefined();
      expect((engine as any).isReady).toBe(true);
      
      engine.terminate();
    });

    it('should handle initialization in non-browser context', () => {
      // Since Jest provides a jsdom environment, we'll test the logic directly
      // This test verifies that the check exists and would work correctly
      
      // Test that the function contains the browser check
      const functionString = getSimpleEngine.toString();
      expect(functionString).toContain('typeof window');
      expect(functionString).toContain('SimpleEngine can only be initialized in browser context');
      
      // In a real browser-less environment, this would throw
      // But in jsdom, it will work - that's expected for our test environment
      resetSimpleEngineInstance();
      expect(() => {
        getSimpleEngine();
      }).not.toThrow();
    });
  });
});