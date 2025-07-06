// Mock Web Workers
global.Worker = jest.fn().mockImplementation(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onmessage: null,
  onerror: null,
}));

// Mock Stockfish WASM
global.Stockfish = jest.fn().mockImplementation(() => ({
  postMessage: jest.fn(),
  addMessageListener: jest.fn(),
  terminate: jest.fn(),
}));

// Mock fetch with retry logic for API tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      category: 'unknown',
      dtz: null,
      precise_dtz: null,
      moves: []
    }),
  })
);

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock next/head
jest.mock('next/head', () => {
  return function Head({ children }) {
    return children;
  };
});

// Mock next/image
jest.mock('next/image', () => {
  return function Image({ src, alt, ...props }) {
    return React.createElement('img', { src, alt, ...props });
  };
});

// Mock chess.js
jest.mock('chess.js', () => ({
  Chess: jest.fn().mockImplementation(() => ({
    ascii: jest.fn(() => 'mock ascii board'),
    board: jest.fn(() => []),
    fen: jest.fn(() => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
    game_over: jest.fn(() => false),
    in_check: jest.fn(() => false),
    in_checkmate: jest.fn(() => false),
    in_stalemate: jest.fn(() => false),
    in_threefold_repetition: jest.fn(() => false),
    insufficient_material: jest.fn(() => false),
    history: jest.fn(() => []),
    isAttacked: jest.fn(() => false),
    isCheck: jest.fn(() => false),
    isCheckmate: jest.fn(() => false),
    isGameOver: jest.fn(() => false),
    isStalemate: jest.fn(() => false),
    load: jest.fn(() => true),
    loadPgn: jest.fn(() => true),
    move: jest.fn((move) => ({
      san: typeof move === 'string' ? move : move.san || 'e4',
      from: typeof move === 'string' ? 'e2' : move.from || 'e2',
      to: typeof move === 'string' ? 'e4' : move.to || 'e4',
      piece: 'p',
      color: 'w',
      flags: 'n',
      captured: undefined,
    })),
    moves: jest.fn(() => ['e4', 'e5', 'Nf3', 'Nc6']),
    pgn: jest.fn(() => '1. e4'),
    put: jest.fn(() => true),
    remove: jest.fn(() => ({ type: 'p', color: 'w' })),
    reset: jest.fn(),
    square_color: jest.fn(() => 'light'),
    turn: jest.fn(() => 'w'),
    undo: jest.fn(() => ({
      san: 'e4',
      from: 'e2',
      to: 'e4',
      piece: 'p',
      color: 'w',
      flags: 'n',
    })),
    validate_fen: jest.fn(() => ({ valid: true })),
  })),
}));

// Mock react-chessboard
jest.mock('react-chessboard', () => ({
  Chessboard: jest.fn(({ position, onPieceDrop, ...props }) => {
    return React.createElement('div', {
      'data-testid': 'chessboard',
      'data-position': position,
      onClick: props.onSquareClick,
      ...props
    });
  }),
}));

// Mock engine and tablebase services
jest.mock('@/shared/lib/chess/engine', () => ({
  Engine: {
    getInstance: jest.fn(() => ({
      evaluatePosition: jest.fn(() => Promise.resolve({
        score: 0,
        mate: null,
        depth: 10,
        nodes: 1000,
        time: 100,
        pv: ['e4', 'e5'],
      })),
      getBestMoves: jest.fn(() => Promise.resolve([
        { move: 'e4', score: 25, depth: 10 },
        { move: 'Nf3', score: 20, depth: 10 },
      ])),
      quit: jest.fn(),
      reset: jest.fn(),
    })),
  },
}));

jest.mock('@/shared/lib/chess/tablebase', () => ({
  tablebaseService: {
    queryPosition: jest.fn(() => Promise.resolve({
      isTablebasePosition: true,
      result: {
        category: 'unknown',
        wdl: 0,
        dtz: null,
        precise_dtz: null,
      },
    })),
    queryMove: jest.fn(() => Promise.resolve({
      isTablebasePosition: true,
      wdlBefore: 0,
      wdlAfter: 0,
      dtzBefore: null,
      dtzAfter: null,
    })),
  },
}));

// Mock logger service
jest.mock('@/shared/services/logging', () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    setContext: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(), 
      error: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn(),
      setContext: jest.fn(),
      clearContext: jest.fn(),
      withFields: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        fatal: jest.fn(),
      }))
    })),
    clearContext: jest.fn(),
    withFields: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn(),
      setContext: jest.fn(),
    }))
  })),
  createLogger: jest.fn(),
  resetLogger: jest.fn(),
  LogLevel: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4
  }
}));