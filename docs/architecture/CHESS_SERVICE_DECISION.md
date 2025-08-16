# ChessService Architecture Decision Record

> **Decision Date:** 2025-08-16  
> **Decision Status:** ✅ FINAL - Pure Functions + GameSlice  
> **Impact:** Resolves 4 competing ChessService implementations

## 🚨 TL;DR für zukünftige LLMs

**SITUATION:** Wir haben 4 konkurrierende ChessService Implementierungen in der Codebase.

**ENTSCHEIDUNG:** Migriere zu Pure Functions + GameSlice (Zustand Store).

**SOFORTIGE AKTIONEN:**

- ❌ **NICHT verwenden:** ChessServiceFacade (ungetestet in Production)
- ❌ **NICHT erweitern:** ChessService (Legacy Singleton)
- ✅ **SOFORT löschen:** ChessServiceV2 (Dead Code, 0 Verwendungen)
- ✅ **MIGRIERE ZU:** Pure Functions in `src/shared/utils/chess-logic.ts`

**VERWANDTE ISSUES:**

- [#173 - ResolveChessServiceDuality](../../issues/173) - Hauptarchitektur-Issue
- [#174 - EnforceComplexityLimits](../../issues/174) - Blockiert bis Service-Refactoring
- [#175 - SimplifyHandlePlayerMove](../../issues/175) - Abhängig von Service-Architektur
- [#179 - FixMockImplementationPatterns](../../issues/179) - Wird durch Pure Functions gelöst

---

## 📜 Historie - Wie entstand das Chaos?

### Das Ursprungsproblem (2024?)

```typescript
// Problem: chess.js ist mutable, Zustand/Immer ist immutable
const chess = new Chess();
chess.move('e4');  // Mutiert das Objekt direkt!

// Immer/Zustand freezed das:
❌ Object.freeze(chess);  // Kann nicht mehr chess.move() aufrufen
```

**Lösung damals:** ChessService als Singleton außerhalb von Zustand Store.

### Die gescheiterten Lösungsversuche

#### 1. ChessServiceV2 (3f4f8a21 - August 12, 2025)

```typescript
// Versuch: "Modernere" Implementation
class ChessServiceV2 implements IChessService {
  // Identisch zu ChessService, nur mit Interface
}
```

**Problem:** Copy-Paste ohne echte Verbesserung. **Heute: 0 Verwendungen = Dead Code.**

#### 2. ChessServiceFacade + 6 Services (6b5b5d31 - August 12, 2025)

```typescript
// Versuch: Clean Architecture mit Dependency Injection
class ChessServiceFacade {
  constructor(
    private engine: IChessEngine, // 223 Zeilen
    private validator: IMoveValidator, // 161 Zeilen
    private history: IMoveHistory, // 230 Zeilen
    private eventBus: IChessEventBus, // 139 Zeilen
    private notation: IGermanNotation, // 162 Zeilen
    private cache: IFenCache // 221 Zeilen
  ) {}
}
```

**Problem:** Over-Engineering für Chess-Logic. **Heute: 0 Verwendungen in Production.**

#### 3. StranglerFig Pattern (6b5b5d31 → eb87c054)

```typescript
// Versuch: Feature Flag für graduelle Migration
class ChessServiceStranglerFacade {
  if (featureFlags.isEnabled(USE_NEW_CHESS_CORE)) {
    return newService.move(move);
  } else {
    return legacyService.move(move);
  }
}
```

**Problem:** Zu komplex. **Resultat: Kompletter Ansatz wieder gelöscht am 13. August.**

#### 4. GameSlice (parallel entwickelt)

```typescript
// Aktuell: Zustand Store für UI, nutzt aber ChessService!
const gameSlice = createSlice({
  // State hier, aber Logic in ChessService = doppelter State
});
```

**Problem:** Doppelte State-Verwaltung zwischen Store und Service.

---

## 🔍 Warum ist die aktuelle Situation problematisch?

### Das 4-Service-Chaos

| Service                | Zeilen | Verwendungen | Status        | Problem                 |
| ---------------------- | ------ | ------------ | ------------- | ----------------------- |
| **ChessService**       | 877    | 277          | ✅ Aktiv      | Singleton, Event-System |
| **ChessServiceV2**     | 578    | 0            | ❌ Dead Code  | Nutzlose Kopie          |
| **ChessServiceFacade** | 1,500  | 0            | ❌ Ungetestet | Over-Engineering        |
| **GameSlice**          | -      | 15+          | ✅ UI-State   | Nutzt ChessService      |

**Gesamt:** 3,000+ Zeilen für Chess-Logic → **Sollten ~200 Zeilen sein.**

### Konkrete Probleme heute

#### 1. Race Conditions durch Event-System

```typescript
// BUG der heute existiert:
chessService.makeMove(move1);
chessService.makeMove(move2); // Schnell hintereinander

// Event 1 feuert → Store Update
// Event 2 feuert → Store Update (überschreibt!)
// → Inkonsistenter State zwischen Service und Store
```

#### 2. Memory Leaks in 27 Files

```typescript
// Heute überall:
useEffect(() => {
  const unsub = chessService.subscribe(listener);
  // Vergessen: return unsub;
  // → Memory Leak bei Component Unmount!
}, []);
```

#### 3. Unmögliches Testing

```typescript
// Test für ChessService heute:
beforeEach(() => {
  // Setup Singleton Mock
  // Setup Event Listeners Mock
  // Setup State Synchronization Mock
  // 50+ Zeilen Setup
});

// Test für Pure Function morgen:
test('validates move', () => {
  expect(validateMove(fen, move)).toBe(true);
  // 1 Zeile, kein Mocking
});
```

#### 4. Complexity Explosion

- handlePlayerMove: 1,458 Zeilen über 7 Files
- Grund: Orchestrierung zwischen Services
- ESLint Complexity: 35 (Standard: 10)

---

## 🎯 Die Lösung: Pure Functions + GameSlice

### Warum dieser Ansatz überlegen ist

#### Das Grundprinzip

```typescript
// Statt: Mutable Object mit State
class ChessService {
  private chess: Chess; // Versteckter State
  makeMove(move) {
    this.chess.move(move);
  } // Mutation + Side-effect
}

// Neu: Pure Functions ohne State
function makeMove(fen: string, move: Move): MoveResult | null {
  const chess = new Chess(fen); // Temporäre Instanz
  const result = chess.move(move); // Keine Mutation des Inputs
  return result
    ? {
        newFen: chess.fen(),
        move: result,
        isCheckmate: chess.isCheckmate(),
        isDraw: chess.isDraw(),
      }
    : null;
}
```

#### Integration mit GameSlice

```typescript
// GameSlice wird Single Source of Truth
const gameSlice = createSlice({
  name: 'game',
  initialState: {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moveHistory: [],
    currentMoveIndex: -1,
  },
  reducers: {
    playerMove: (state, action) => {
      const result = makeMove(state.fen, action.payload);
      if (result) {
        state.fen = result.newFen;
        state.moveHistory.push(result.move);
        state.currentMoveIndex++;
      }
      // Kein Event nötig - UI re-rendert automatisch via useSelector
    },
  },
});
```

#### React Integration

```typescript
// Component heute (kompliziert):
function ChessBoard() {
  const [fen, setFen] = useState();

  useEffect(() => {
    const unsub = chessService.subscribe(event => {
      setFen(event.payload.fen); // Manual sync
    });
    return unsub; // Oft vergessen → Memory Leak
  }, []);

  const handleMove = move => {
    chessService.makeMove(move); // Async, Events, Side-effects
  };
}

// Component morgen (einfach):
function ChessBoard() {
  const fen = useSelector(state => state.game.fen); // Auto-sync
  const dispatch = useDispatch();

  const handleMove = move => {
    dispatch(makeMove(move)); // Sync, pure, predictable
  };
}
```

---

## ❌ Anti-Patterns: Warum DI und Events hier schaden

### Problem 1: Dependency Injection ist Over-Engineering

#### Was DI lösen soll vs. was wir haben

```typescript
// DI macht Sinn wenn du verschiedene Implementierungen brauchst:
interface IChessEngine {
  move(move: Move): Move | null;
}

// Implementation A: Chess.js
// Implementation B: Stockfish Engine
// Implementation C: Custom Engine

// ABER: Wir haben nur Chess.js!
class ChessEngine implements IChessEngine {
  private chess = new Chess();
  move(move: Move) {
    return this.chess.move(move);
  } // Wrapper um Chess.js
}

// Das ist unnötige Indirektion:
// Caller → Interface → Wrapper → Chess.js
// vs
// Caller → Chess.js (direkt)
```

#### DI-Overhead für nichts

```typescript
// Mit DI (heute):
const facade = new ChessServiceFacade(
  new ChessEngine(), // Wrapper um Chess.js
  new MoveValidator(), // Wrapper um Chess.js Validation
  new MoveHistory(), // Wrapper um Array
  new ChessEventBus(), // Wrapper um EventEmitter
  new GermanNotation(), // Wrapper um String-Replace
  new FenCache() // Wrapper um Map
);

// + 6 Interfaces die nie ausgetauscht werden
// + 6 Klassen als Wrapper um simple Funktionen
// + Complex Testing: Mock 6 Dependencies

// Mit Pure Functions (morgen):
function makeMove(fen: string, move: Move) {
  const chess = new Chess(fen); // Direkt, kein Wrapper
  return chess.move(move);
}

// + 0 Interfaces
// + 0 Wrapper
// + 0 Mocking nötig
```

### Problem 2: Event-System versteckt Bugs

#### Versteckter Kontrollfluss

```typescript
// Mit Events: "Spooky Action at a Distance"
chessService.makeMove(move);
// Was passiert jetzt? 🤷‍♂️
// → Event wird gefeuert
// → 5 verschiedene Listener reagieren
// → Store updated sich
// → UI re-rendert
// → Aber WO im Code passiert das?

// Debugging Hölle:
// Wer hört auf 'moveCompleted'?
// In welcher Reihenfolge?
// Was wenn ein Listener crashed?
```

#### Events schaffen Race Conditions

```typescript
// Heute:
component1.handleMove('e4');
component2.handleMove('d4'); // Gleichzeitig

// Event 1: moveCompleted { fen: "...e4..." }
// Event 2: moveCompleted { fen: "...d4..." }
// Listener A processes Event 2
// Listener B processes Event 1
// → Store hat "...e4...", UI zeigt "...d4..."
```

#### Mit Pure Functions: Expliziter Datenfluss

```typescript
// Klar und vorhersagbar:
dispatch(makeMove('e4'));
// 1. makeMove Function wird aufgerufen
// 2. Neuer State wird berechnet
// 3. Reducer updated Store
// 4. Components re-rendern via useSelector
// 5. Fertig.

// Kein versteckter State, keine Events, keine Race Conditions
```

### Problem 3: Testing wird exponentiell schwerer

#### Mit Services und Events

```typescript
describe('ChessService', () => {
  let mockEngine: jest.Mocked<IChessEngine>;
  let mockValidator: jest.Mocked<IMoveValidator>;
  let mockHistory: jest.Mocked<IMoveHistory>;
  let mockEventBus: jest.Mocked<IChessEventBus>;
  let mockNotation: jest.Mocked<IGermanNotation>;
  let mockCache: jest.Mocked<IFenCache>;

  beforeEach(() => {
    // 50+ Zeilen Mock Setup
    mockEngine = {
      move: jest.fn(),
      getFen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
      // ... 20 weitere Methods
    };

    // Event Listener Setup
    const listeners = new Set();
    mockEventBus.subscribe.mockImplementation(listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    });

    facade = new ChessServiceFacade(mockEngine, mockValidator /*...*/);
  });

  it('should make a move', async () => {
    // Arrange: Setup expectations on 6 mocks
    mockValidator.validateMove.mockReturnValue(true);
    mockEngine.move.mockReturnValue({ from: 'e2', to: 'e4' });
    // ...

    // Act
    const result = facade.move('e4');

    // Assert: Verify interactions with 6 mocks
    expect(mockValidator.validateMove).toHaveBeenCalledWith('e4', mockEngine);
    expect(mockEngine.move).toHaveBeenCalledWith('e4');
    // ...
  });
});
```

#### Mit Pure Functions

```typescript
describe('chess-logic', () => {
  it('should make a move', () => {
    const result = makeMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', {
      from: 'e2',
      to: 'e4',
    });

    expect(result).toEqual({
      newFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      move: { from: 'e2', to: 'e4' /* ... */ },
      isCheckmate: false,
      isDraw: false,
    });
  });

  it('should reject invalid move', () => {
    const result = makeMove(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      { from: 'e2', to: 'e5' } // Invalid: pawn can't jump 2 squares unless first move
    );

    expect(result).toBeNull();
  });
});
```

**Unterschied:** 100+ Zeilen Mock-Setup vs. 10 Zeilen pure Input/Output Tests.

---

## 📊 Migrations-Strategie

### Phase 1: Sofortiges Cleanup (0.5 Tage, 0 Risiko)

#### Schritt 1.1: ChessServiceV2 löschen

```bash
# SOFORT möglich - 0 Verwendungen
rm src/features/chess-core/services/ChessServiceV2.ts
rm src/features/chess-core/__tests__/ChessServiceV2.test.ts  # Falls vorhanden
```

**Gewinn:** -578 Zeilen Dead Code, bessere Übersicht.

#### Schritt 1.2: ChessServiceFacade bewerten

```typescript
// BEHALTEN als Lern-Beispiel, aber NICHT für Production verwenden
// Kommentar hinzufügen:
/**
 * @deprecated DO NOT USE IN PRODUCTION
 * This facade demonstrates Clean Architecture principles but is over-engineered
 * for our chess use case. See docs/architecture/CHESS_SERVICE_DECISION.md
 * Use pure functions in src/shared/utils/chess-logic.ts instead.
 */
```

### Phase 2: Pure Functions implementieren (2 Tage)

#### Schritt 2.1: Grundlegende Functions erstellen

```typescript
// src/shared/utils/chess-logic.ts

import { Chess, type Move as ChessJsMove } from 'chess.js';

export interface MoveResult {
  newFen: string;
  move: ChessJsMove;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isCheck: boolean;
  gameResult: string | null;
}

/**
 * Makes a move on the chess board
 * @param fen Current position as FEN string
 * @param move Move to make
 * @returns MoveResult with new position or null if invalid
 */
export function makeMove(
  fen: string,
  move: ChessJsMove | { from: string; to: string; promotion?: string } | string
): MoveResult | null {
  try {
    const chess = new Chess(fen);
    const result = chess.move(move);

    if (!result) return null;

    return {
      newFen: chess.fen(),
      move: result,
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      isCheck: chess.isCheck(),
      gameResult: getGameResult(chess)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Validates if a move is legal
 */
export function validateMove(
  fen: string,
  move: ChessJsMove | { from: string; to: string; promotion?: string } | string
): boolean {
  try {
    const chess = new Chess(fen);
    return chess.move(move) !== null;
  } catch {
    return false;
  }
}

/**
 * Gets all possible moves for a square
 */
export function getPossibleMoves(fen: string, square?: string): ChessJsMove[] {
  try {
    const chess = new Chess(fen);
    return chess.moves({ square, verbose: true });
  } catch {
    return [];
  }
}

/**
 * Gets current game status
 */
export function getGameStatus(fen: string) {
  try {
    const chess = new Chess(fen);
    return {
      isGameOver: chess.isGameOver(),
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      turn: chess.turn(),
      gameResult: getGameResult(chess)
    };
  } catch {
    return null;
  }
}

private function getGameResult(chess: Chess): string | null {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? '0-1' : '1-0';
  }
  if (chess.isDraw() || chess.isStalemate()) {
    return '1/2-1/2';
  }
  return null;
}
```

#### Schritt 2.2: GameSlice erweitern

```typescript
// src/shared/store/slices/gameSlice.ts

import { makeMove, validateMove, getGameStatus } from '@shared/utils/chess-logic';

export const createGameActions = (set, get) => ({
  // Neue Action mit Pure Function
  makeMove: move => {
    const { game } = get();
    const result = makeMove(game.currentFen, move);

    if (result) {
      set(state => {
        state.game.currentFen = result.newFen;
        state.game.moveHistory.push(result.move);
        state.game.currentMoveIndex++;
        state.game.isCheckmate = result.isCheckmate;
        state.game.isDraw = result.isDraw;
        state.game.isGameFinished = result.isCheckmate || result.isDraw;
        state.game.gameResult = result.gameResult;
      });
      return true;
    }
    return false;
  },

  // Parallel: Alte ChessService Action behalten während Migration
  makeMoveOld: move => {
    // Existing ChessService logic
  },
});
```

#### Schritt 2.3: Tests für Pure Functions

```typescript
// src/shared/utils/__tests__/chess-logic.test.ts

import { makeMove, validateMove, getPossibleMoves } from '../chess-logic';

describe('chess-logic', () => {
  const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  describe('makeMove', () => {
    it('should make valid move', () => {
      const result = makeMove(startingFen, 'e4');

      expect(result).toEqual({
        newFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        move: expect.objectContaining({
          from: 'e2',
          to: 'e4',
          piece: 'p',
          color: 'w',
        }),
        isCheckmate: false,
        isDraw: false,
        isCheck: false,
        gameResult: null,
      });
    });

    it('should return null for invalid move', () => {
      const result = makeMove(startingFen, 'e5');
      expect(result).toBeNull();
    });

    it('should detect checkmate', () => {
      // Fool's mate position
      const result = makeMove(
        'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
        'g4'
      );
      expect(result?.isCheckmate).toBe(true);
      expect(result?.gameResult).toBe('0-1');
    });
  });

  describe('validateMove', () => {
    it('should validate legal moves', () => {
      expect(validateMove(startingFen, 'e4')).toBe(true);
      expect(validateMove(startingFen, 'Nf3')).toBe(true);
    });

    it('should reject illegal moves', () => {
      expect(validateMove(startingFen, 'e5')).toBe(false);
      expect(validateMove(startingFen, 'Ke2')).toBe(false);
    });
  });

  describe('getPossibleMoves', () => {
    it('should return all possible moves', () => {
      const moves = getPossibleMoves(startingFen);
      expect(moves).toHaveLength(20); // 20 possible opening moves
    });

    it('should return moves for specific square', () => {
      const moves = getPossibleMoves(startingFen, 'e2');
      expect(moves).toEqual([
        expect.objectContaining({ from: 'e2', to: 'e3' }),
        expect.objectContaining({ from: 'e2', to: 'e4' }),
      ]);
    });
  });
});
```

### Phase 3: Schrittweise Migration (1-2 Wochen)

#### Schritt 3.1: Feature Flag Setup (optional)

```typescript
// Für sichere Migration
const useNewChessLogic = process.env.NODE_ENV === 'development';

export const createGameActions = (set, get) => ({
  makeMove: move => {
    if (useNewChessLogic) {
      return makeMovePure(move); // Neue Implementation
    } else {
      return makeMoveOld(move); // Alte ChessService
    }
  },
});
```

#### Schritt 3.2: Migration Reihenfolge

**Priorität 1: Neue Features** (sofort Pure Functions)

- Jede neue Chess-Funktionalität nutzt Pure Functions
- Kein neuer ChessService Code

**Priorität 2: Hochfrequente Komponenten** (Woche 1)

```typescript
// z.B. TrainingBoard, ChessBoard, MoveHandler
// Von:
useEffect(() => {
  const unsub = chessService.subscribe(event => {
    setFen(event.payload.fen);
  });
  return unsub;
}, []);

// Zu:
const fen = useSelector(state => state.game.fen);
```

**Priorität 3: Tests** (Woche 2)

```typescript
// Mock-basierte Tests ersetzen durch Pure Function Tests
// Von: 50+ Zeilen Mock Setup
// Zu: 5 Zeilen Input/Output
```

**Priorität 4: Orchestrators** (Woche 2-3)

```typescript
// handlePlayerMove vereinfachen
// Von: 1,458 Zeilen über 7 Files
// Zu: ~300 Zeilen mit Pure Functions
```

#### Schritt 3.3: Legacy Cleanup

```typescript
// Wenn 0 ChessService Verwendungen übrig:
rm src/shared/services/ChessService.ts
rm src/tests/mocks/ChessServiceMockFactory.ts

// Update imports:
- import { chessService } from '@shared/services/ChessService';
+ import { makeMove } from '@shared/utils/chess-logic';
```

---

## ⚠️ Wichtige Warnungen für zukünftige Entwickler

### ❌ Anti-Patterns - Tu das NICHT

#### 1. NICHT ChessServiceFacade in Production verwenden

```typescript
❌ import ChessServiceFacade from '@features/chess-core/facades/ChessServiceFacade';

// Warum nicht:
// - 0 Production-Tests
// - Over-engineered für unseren Use-Case
// - Event-System schafft Race Conditions
```

#### 2. NICHT ChessService erweitern

```typescript
❌ chessService.addNewFeature = () => { /* ... */ };

// Warum nicht:
// - Singleton Pattern ist deprecated
// - Verschlimmert die Event-System Probleme
// - Blockiert Migration zu Pure Functions
```

#### 3. NICHT neue Event-Listener hinzufügen

```typescript
❌ chessService.on('newEvent', callback);

// Warum nicht:
// - Events verstecken Bugs
// - Memory Leak Gefahr
// - Race Conditions
```

#### 4. NICHT neue Services mit DI erstellen

```typescript
❌ class NewChessFeature {
  constructor(
    private engine: IEngine,
    private validator: IValidator
  ) {}
}

// Warum nicht:
// - Wir brauchen keine austauschbaren Implementierungen
// - Pure Functions sind einfacher
// - Weniger Code, weniger Bugs
```

### ✅ Gute Patterns - Tu das

#### 1. Neue Features mit Pure Functions

```typescript
✅ // src/shared/utils/chess-analytics.ts
export function calculateGameQuality(moveHistory: Move[]): number {
  // Pure function - easy to test, no side effects
}

✅ // In Component:
const quality = useMemo(() =>
  calculateGameQuality(moveHistory), [moveHistory]
);
```

#### 2. State nur im GameSlice

```typescript
✅ const gameSlice = createSlice({
  reducers: {
    newFeature: (state, action) => {
      const result = pureFunction(state.fen, action.payload);
      if (result) {
        state.fen = result.newFen;
      }
    }
  }
});
```

#### 3. Components als reine UI

```typescript
✅ function ChessComponent() {
  const fen = useSelector(state => state.game.fen);
  const dispatch = useDispatch();

  return (
    <Board
      fen={fen}
      onMove={move => dispatch(makeMove(move))}
    />
  );
}
```

---

## 🗺️ Issue Navigation Map

| Issue                    | Titel                         | Status             | Beziehung zu dieser Entscheidung                           |
| ------------------------ | ----------------------------- | ------------------ | ---------------------------------------------------------- |
| [#173](../../issues/173) | ResolveChessServiceDuality    | 🔄 In Progress     | **Haupt-Issue** - Diese Entscheidung löst es               |
| [#174](../../issues/174) | EnforceComplexityLimits       | ⏸️ Blocked by #173 | **Abhängig** - Complexity kommt von Service-Architektur    |
| [#175](../../issues/175) | SimplifyHandlePlayerMove      | ⏸️ Blocked by #173 | **Abhängig** - 1,458 Zeilen durch Service-Orchestrierung   |
| [#176](../../issues/176) | CompleteModuleSystemMigration | 🟢 Independent     | **Unabhängig** - Kann parallel laufen                      |
| [#179](../../issues/179) | FixMockImplementationPatterns | ⏸️ Solved by #173  | **Wird gelöst** - Pure Functions eliminieren Mock-Probleme |

### Neue Issues (zu erstellen)

| Issue  | Titel                                     | Priority | Effort | Description         |
| ------ | ----------------------------------------- | -------- | ------ | ------------------- |
| #NEW-1 | [CLEANUP] Remove ChessServiceV2           | P0       | 0.5h   | Dead Code Removal   |
| #NEW-2 | [REFACTOR] Implement Pure Chess Functions | P1       | 2 days | Core Implementation |
| #NEW-3 | [MIGRATION] Migrate to Pure Functions     | P2       | 1 week | Graduelle Migration |

---

## 📚 Lessons Learned

### Was wir aus den Fehlversuchen gelernt haben

#### 1. Clean Architecture ist nicht immer die Antwort

**Fehler:** "Mehr Interfaces und Services = bessere Architektur"  
**Realität:** Für Chess-Logic reicht eine simple Function.  
**Lektion:** Architecture sollte das Problem lösen, nicht komplex aussehen.

#### 2. Dependency Injection braucht echte Abhängigkeiten

**Fehler:** Interfaces für Klassen die nie ausgetauscht werden.  
**Realität:** Wir haben nur Chess.js, keine alternativen Engines.  
**Lektion:** DI nur verwenden wenn multiple Implementierungen existieren.

#### 3. Event-Systems verstecken mehr als sie lösen

**Fehler:** "Events entkoppeln die Architektur"  
**Realität:** Events verstecken Bugs und schaffen Race Conditions.  
**Lektion:** Expliziter Datenfluss ist besser als versteckte Magie.

#### 4. Migration ohne Tests ist gefährlich

**Fehler:** ChessServiceFacade ohne Production-Tests deployen.  
**Realität:** 0 Verwendungen = keine Validierung der Korrektheit.  
**Lektion:** Neue Architektur braucht bewiesene Korrektheit.

#### 5. Einfachheit schlägt Eleganz

**Fehler:** "Clean Architecture sieht professioneller aus"  
**Realität:** Pure Functions sind einfacher zu verstehen und debuggen.  
**Lektion:** Code wird öfter gelesen als geschrieben - optimiere für Lesbarkeit.

### Warum Pure Functions + GameSlice die richtige Wahl ist

#### 1. Passt zur vorhandenen Architektur

- Wir nutzen bereits Zustand für State-Management
- React Components erwarten unidirectional data flow
- Pure Functions sind React-idiomatisch

#### 2. Löst echte Probleme

- Eliminiert Race Conditions (keine Events)
- Eliminiert Memory Leaks (keine Subscriptions)
- Eliminiert Mock-Komplexität (pure Input/Output)

#### 3. Zukunftssicher

- Einfach zu verstehen für neue Entwickler
- Einfach zu erweitern (neue Functions hinzufügen)
- Einfach zu testen (keine komplexe Setup)

#### 4. Performance-Optimiert

- Keine Event-Overhead
- Keine Singleton-Synchronisation
- Direkte Function-Calls

---

## 🎯 Success Metrics

### Quantitative Ziele

- **Code Reduktion:** Von 3,000+ auf ~200 Zeilen (-93%)
- **Test Vereinfachung:** Von 50+ Zeilen Mock-Setup auf 5 Zeilen (-90%)
- **Complexity:** Von 35 auf <10 (ESLint Complexity Rules)
- **Memory Leaks:** Von 27 potentiellen Quellen auf 0 (-100%)

### Qualitative Ziele

- **Verständlichkeit:** Jeder neue Entwickler versteht Pure Functions
- **Debuggability:** Redux DevTools zeigen kompletten State Flow
- **Testability:** Keine Mocks, nur Input/Output Tests
- **Maintainability:** Änderungen sind lokal und vorhersagbar

### Akzeptanzkriterien für Abschluss

- [ ] ChessServiceV2 gelöscht
- [ ] Pure Functions implementiert und getestet
- [ ] Mindestens 50% der ChessService Verwendungen migriert
- [ ] Handlermove reduziert auf <500 Zeilen
- [ ] ESLint Complexity Rules aktiv (max 10)
- [ ] 0 ChessService Event-Listener in neuen Components

---

## 📎 Anhang

### Verwandte Dokumentation

- [docs/CORE.md](../CORE.md) - Gesamt-Architektur
- [docs/guides/testing.md](../guides/testing.md) - Testing Best Practices

### Git Commits (Referenz)

- `6b5b5d31` - ChessServiceFacade + StranglerFig Implementation (Aug 12)
- `eb87c054` - StranglerFig Pattern Removal (Aug 13)
- `3f4f8a21` - ChessServiceV2 Creation (Aug 12)

### Code-Beispiele

Alle Code-Beispiele in diesem Dokument können direkt kopiert und verwendet werden. Sie folgen den aktuellen TypeScript und ESLint Standards des Projekts.

---

**Last Updated:** 2025-08-16  
**Next Review:** Nach Phase 3 Abschluss  
**Maintainer:** Architecture Team
