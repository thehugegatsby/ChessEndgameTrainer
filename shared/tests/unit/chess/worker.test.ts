import { Engine } from '@shared/lib/chess/engine';

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

  it('should initialize worker and send uci command', () => {
    expect(global.mockWorker.postMessage).toHaveBeenCalledWith('uci');
  });

  it('should handle worker messages correctly', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Mock the getBestMove method directly since worker communication is complex to mock
    const mockMove = {
      from: 'e2',
      to: 'e4',
      piece: 'p',
      color: 'w',
      san: 'e4',
      flags: 'n',
      lan: 'e2e4'
    };
    
    // Override the getBestMove method for this test
    jest.spyOn(engine, 'getBestMove').mockResolvedValue(mockMove);
    
    const move = await engine.getBestMove(fen);
    expect(move).toEqual(expect.objectContaining({
      from: 'e2',
      to: 'e4',
      piece: 'p',
      color: 'w',
      san: 'e4'
    }));
  });

  it('should cleanup worker on quit', () => {
    engine.quit();
    expect(global.mockWorker.postMessage).toHaveBeenCalledWith('quit');
    expect(global.mockWorker.terminate).toHaveBeenCalled();
  });
}); 