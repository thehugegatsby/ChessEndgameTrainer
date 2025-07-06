import { Engine } from '@/lib/chess/engine';
import { act } from '@testing-library/react';

// Use the global mockWorker from jest.setup.js
declare global {
  var mockWorker: any;
}

describe('Engine', () => {
  let engine: Engine;

  beforeEach(() => {
    // Reset the singleton instance
    (Engine as any).instance = null;
    engine = Engine.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
    engine.quit();
    (Engine as any).instance = null;
  });

  it('should initialize correctly', () => {
    expect(engine).toBeDefined();
    expect(global.Worker).toBeDefined();
  });

  it('should queue commands before worker is ready', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const movePromise = engine.getBestMove(fen);

    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate Stockfish ready
    act(() => {
      if (global.mockWorker.onmessage) {
        global.mockWorker.onmessage({ data: 'uciok' });
        global.mockWorker.onmessage({ data: 'readyok' });
      }
    });
    
    // Wait for engine to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now send bestmove
    act(() => {
      if (global.mockWorker.onmessage) {
        global.mockWorker.onmessage({ data: 'bestmove e2e4' });
      }
    });
    
    const move = await movePromise;
    expect(move).toBeDefined();
    expect(move?.san).toBe('e4');
  }, 10000);

  it('should handle no move available', async () => {
    const fen = '8/8/8/8/8/8/8/8 w - - 0 1';
    
    // Start initialization
    const readyPromise = engine.getReadyEngine();
    
    // Wait a bit for initialization to start
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate Stockfish ready
    act(() => {
      if (global.mockWorker.onmessage) {
        global.mockWorker.onmessage({ data: 'uciok' });
        global.mockWorker.onmessage({ data: 'readyok' });
      }
    });
    
    // Wait for engine to be ready
    await readyPromise;
    
    const movePromise = engine.getBestMove(fen);
    
    // Wait a bit for the command to be sent
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate no move response
    act(() => {
      if (global.mockWorker.onmessage) {
        global.mockWorker.onmessage({ data: 'bestmove (none)' });
      }
    });
    
    const move = await movePromise;
    expect(move).toBeNull();
  }, 10000);

  it('should evaluate position and resolve with score', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Start initialization
    const readyPromise = engine.getReadyEngine();
    
    // Wait a bit for initialization to start
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate Stockfish ready
    act(() => {
      if (global.mockWorker.onmessage) {
        global.mockWorker.onmessage({ data: 'uciok' });
        global.mockWorker.onmessage({ data: 'readyok' });
      }
    });
    
    // Wait for engine to be ready
    await readyPromise;
    
    const evalPromise = engine.evaluatePosition(fen);
    
    // Wait a bit for the command to be sent
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate evaluation response
    act(() => {
      if (global.mockWorker.onmessage) {
        global.mockWorker.onmessage({ data: 'info depth 10 score cp 42' });
        global.mockWorker.onmessage({ data: 'bestmove e2e4' });
      }
    });
    
    const evaluation = await evalPromise;
    expect(evaluation.score).toBe(42); // Engine returns centipawns
  }, 10000);

  it('should reset the chess instance', () => {
    engine.reset();
    expect(typeof engine.getBestMove).toBe('function');
  });

  it('should cleanup stockfish and listeners', async () => {
    // Start initialization
    const readyPromise = engine.getReadyEngine();
    
    // Wait a bit for initialization to start
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate Stockfish ready
    act(() => {
      if (global.mockWorker.onmessage) {
        global.mockWorker.onmessage({ data: 'uciok' });
        global.mockWorker.onmessage({ data: 'readyok' });
      }
    });
    
    // Wait for engine to be ready
    await readyPromise;
    
    // Now quit
    engine.quit();
    
    // Verify cleanup
    expect(global.mockWorker.postMessage).toHaveBeenCalledWith('quit');
    expect(global.mockWorker.terminate).toHaveBeenCalled();
  });
}); 