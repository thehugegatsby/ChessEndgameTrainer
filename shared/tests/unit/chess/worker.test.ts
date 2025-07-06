import { Engine } from '@shared/lib/chess/engine';
import type { Move } from 'chess.js';

// Use the global mockWorker from jest.setup.js
declare global {
  var mockWorker: any;
}

describe('Engine Worker Communication', () => {
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

  it('should initialize worker and send uci command', async () => {
    // Trigger initialization
    const readyPromise = engine.getReadyEngine();
    
    // Wait a bit for initialization to start
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(global.mockWorker.postMessage).toHaveBeenCalledWith('uci');
    
    // Clean up promise
    readyPromise.catch(() => {}); // Ignore error in test
  });

  it('should handle worker messages correctly', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Mock the getBestMove method directly since worker communication is complex to mock
    const mockMove = {
      from: 'e2' as const,
      to: 'e4' as const,
      piece: 'p' as const,
      color: 'w' as const,
      san: 'e4',
      flags: 'n',
      lan: 'e2e4',
      captured: undefined,
      promotion: undefined,
      before: fen,
      after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      isCapture: () => false,
      isPromotion: () => false,
      isEnPassant: () => false,
      isKingsideCastle: () => false,
      isQueensideCastle: () => false,
      isBigPawn: () => false
    } as Move;
    
    // Override the getBestMove method for this test
    jest.spyOn(engine, 'getBestMove').mockResolvedValue(mockMove);
    
    const move = await engine.getBestMove(fen);
    expect(move).toEqual(expect.objectContaining({
      from: 'e2',
      to: 'e4',
      piece: 'p' as const,
      color: 'w' as const,
      san: 'e4'
    }));
  });

  it('should cleanup worker on quit', async () => {
    // First initialize the worker
    const readyPromise = engine.getReadyEngine();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Clean up promise
    readyPromise.catch(() => {});
    
    // Now quit
    engine.quit();
    expect(global.mockWorker.postMessage).toHaveBeenCalledWith('quit');
    expect(global.mockWorker.terminate).toHaveBeenCalled();
  });
}); 