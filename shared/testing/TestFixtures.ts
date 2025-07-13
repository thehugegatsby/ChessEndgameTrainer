// shared/testing/TestFixtures.ts

// A simple interface for type safety and editor autocompletion on move objects.
interface TestMove {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

// Grouping all FEN strings into a single, clearly named constant.
export const TEST_FENS: Record<string, string> = {
  STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  KQK_TABLEBASE_WIN: '8/8/8/8/3K4/8/7Q/4k3 w - - 0 1',
  KRK_TABLEBASE_DRAW: '8/8/8/8/8/7R/4K1k1/8 b - - 40 80',
  KPK_WINNING: '8/8/8/8/8/4K3/4P3/4k3 w - - 0 1',
  KPK_DRAWING: '8/8/8/8/8/4k3/4P3/7K w - - 0 1',
  ROOK_ENDGAME: '8/8/1K6/8/8/8/2k5/4R3 w - - 0 1',
  QUEEN_ENDGAME: '8/8/8/8/5K2/2q5/8/4k3 w - - 0 1',
  EQUAL_POSITION: '8/8/3k4/6r1/8/8/1KR5/8 w - - 0 1',
  WHITE_ADVANTAGE: 'rnbqkbnr/ppppp2p/6P1/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 3',
  BLACK_ADVANTAGE: 'rnbqkbnr/ppp2ppp/8/4p3/4p2P/7N/PPPP1PP1/RNBQKB1R b KQkq - 1 4',
  INVALID_FEN: 'invalid fen string',
  EMPTY_FEN: '',
  MALFORMED_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR X KQkq - 0 1',
};

// Grouping all move objects with the new TestMove type.
export const TEST_MOVES: Record<string, TestMove> = {
  E2E4: { from: 'e2', to: 'e4' },
  D2D4: { from: 'd2', to: 'd4' },
  NG1F3: { from: 'g1', to: 'f3' },
  ILLEGAL_MOVE: { from: 'e2', to: 'e5' },
  INVALID_SQUARE: { from: 'z9', to: 'a1' },
  PROMOTION_QUEEN: { from: 'e7', to: 'e8', promotion: 'q' },
  PROMOTION_ROOK: { from: 'e7', to: 'e8', promotion: 'r' },
  BLACK_PROMOTION_QUEEN: { from: 'e2', to: 'e1', promotion: 'q' },
};

// A declarative constant array is simpler and more direct than a getter function for static data.
export const TABLEBASE_POSITION_FENS: string[] = [
  TEST_FENS.KQK_TABLEBASE_WIN,
  TEST_FENS.KRK_TABLEBASE_DRAW,
  TEST_FENS.KPK_WINNING,
  TEST_FENS.KPK_DRAWING,
  TEST_FENS.ROOK_ENDGAME,
  TEST_FENS.QUEEN_ENDGAME
];

// Legacy compatibility function for getTablebasePositions() 
export function getTablebasePositions(): string[] {
  return TABLEBASE_POSITION_FENS;
}