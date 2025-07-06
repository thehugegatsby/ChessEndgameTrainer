import { isCriticalMistake } from '@/lib/chess/mistakeCheck';
import { Engine } from '@/lib/chess/engine';

// Mock the Engine
jest.mock('@/lib/chess/engine');

describe('isCriticalMistake', () => {
  let mockEngine: jest.Mocked<Engine>;

  beforeEach(() => {
    mockEngine = {
      evaluatePosition: jest.fn(),
      getBestMove: jest.fn(),
      reset: jest.fn(),
      quit: jest.fn(),
    } as any;

    (Engine.getInstance as jest.Mock).mockReturnValue(mockEngine);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sollte einen Zug, der einen Gewinn zu einem Remis macht, als Fehler erkennen', async () => {
    const fenBefore = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const fenAfter = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

    // Mock: Vorher gewinnend (+500), nachher nur noch Remis (+50)
    mockEngine.evaluatePosition
      .mockResolvedValueOnce({ score: 500, mate: null }) // fenBefore
      .mockResolvedValueOnce({ score: 50, mate: null });  // fenAfter

    const isMistake = await isCriticalMistake(fenBefore, fenAfter);
    expect(isMistake).toBe(true);
  });

  it('sollte einen Zug, der einen Gewinn zu einem Verlust macht, als Fehler erkennen', async () => {
    const fenBefore = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const fenAfter = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

    // Mock: Vorher gewinnend (+400), nachher verloren (-400)
    mockEngine.evaluatePosition
      .mockResolvedValueOnce({ score: 400, mate: null }) // fenBefore
      .mockResolvedValueOnce({ score: -400, mate: null }); // fenAfter

    const isMistake = await isCriticalMistake(fenBefore, fenAfter);
    expect(isMistake).toBe(true);
  });

  it('sollte einen korrekten Zug nicht als Fehler erkennen', async () => {
    const fenBefore = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const fenAfter = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

    // Mock: Vorher gewinnend (+400), nachher immer noch gewinnend (+350)
    mockEngine.evaluatePosition
      .mockResolvedValueOnce({ score: 400, mate: null }) // fenBefore
      .mockResolvedValueOnce({ score: 350, mate: null }); // fenAfter

    const isMistake = await isCriticalMistake(fenBefore, fenAfter);
    expect(isMistake).toBe(false);
  });

  it('sollte Matt-Bewertungen korrekt behandeln', async () => {
    const fenBefore = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const fenAfter = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

    // Mock: Vorher Matt in 3 Zügen, nachher nur noch +100
    mockEngine.evaluatePosition
      .mockResolvedValueOnce({ score: 0, mate: 3 })    // fenBefore (Matt für Weiß)
      .mockResolvedValueOnce({ score: 100, mate: null }); // fenAfter

    const isMistake = await isCriticalMistake(fenBefore, fenAfter);
    expect(isMistake).toBe(true);
  });
}); 