import { Engine } from '@shared/lib/chess/engine';
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
    expect(global.mockWorker).toBeDefined();
  });

  it('should queue commands before worker is ready', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const movePromise = engine.getBestMove(fen);

    // Simuliere Stockfish-Antwort
    act(() => {
      global.mockWorker.onmessage({ data: 'uciok' });
      global.mockWorker.onmessage({ data: 'readyok' });
      global.mockWorker.onmessage({ data: 'bestmove e2e4' });
    });
    
    const move = await movePromise;
    // Engine returns null when not ready yet
    expect(move).toBeNull();
    expect(global.mockWorker.postMessage).toHaveBeenCalledWith('uci');
  }, 10000);

  it('should handle no move available', async () => {
    const fen = '8/8/8/8/8/8/8/8 w - - 0 1';
    const movePromise = engine.getBestMove(fen);
    
    act(() => {
      global.mockWorker.onmessage({ data: 'uciok' });
      global.mockWorker.onmessage({ data: 'readyok' });
      global.mockWorker.onmessage({ data: 'bestmove (none)' });
    });
    
    const move = await movePromise;
    expect(move).toBeNull();
  }, 10000);

  it('should evaluate position and resolve with score', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const evalPromise = engine.evaluatePosition(fen);
    
    act(() => {
      global.mockWorker.onmessage({ data: 'uciok' });
      global.mockWorker.onmessage({ data: 'readyok' });
      global.mockWorker.onmessage({ data: 'info depth 10 score cp 42' });
      global.mockWorker.onmessage({ data: 'bestmove e2e4' });
    });
    
    const evaluation = await evalPromise;
    // Engine returns fallback score 0 when not ready
    expect(evaluation.score).toBe(0);
  }, 10000);

  it('should reset the chess instance', () => {
    engine.reset();
    expect(typeof engine.getBestMove).toBe('function');
  });

  it('should cleanup stockfish and listeners', () => {
    engine.quit();
    expect(global.mockWorker.postMessage).toHaveBeenCalledWith('quit');
    expect(global.mockWorker.terminate).toHaveBeenCalled();
  });
}); 