# Chess Endgame Trainer - Refactoring Plan

## 🎯 Executive Summary

Dieser Plan dokumentiert den kompletten Neuaufbau der Chess Endgame Trainer Architektur. Nach einer ausführlichen Analyse mit Gemini-2.5-Pro und GPT-5 haben wir festgestellt, dass die aktuelle Architektur unhaltbar overengineered ist und radikale Vereinfachung benötigt.

**Entscheidung**: Harter Cut und Neuaufbau statt schrittweise Refaktorierung, da:
- Wir sind nicht in Produktion
- Die Architektur-Schulden sind zu tief verwurzelt
- Ein Neuaufbau ist schneller als Reparaturversuche

---

## 📊 Problemanalyse

### Aktuelle Architektur-Probleme

#### 1. Excessive Layering (7+ Abstraktionsschichten)
```
User Input → handlePlayerMove → orchestratorMoveService → MoveService → 
GameStateService → ChessGameLogic → chess.js
```

**Problem**: Jede Schicht fügt Komplexität hinzu, ohne echten Mehrwert zu bieten.

#### 2. God Function Anti-Pattern
- `handlePlayerMove`: 500+ Zeilen
- Macht alles: Parsing, Validierung, Tablebase-Queries, UI-Updates, State-Management
- Untestbar und unwartbar

#### 3. Verteilte Verantwortlichkeiten
- Move-Parsing in 4 verschiedenen Dateien
- Gleiche Regex-Logik dupliziert
- Unklare Grenzen zwischen Services

#### 4. State Management Chaos
- Redux/Zustand Store
- Service-interne States
- React Component State
- Alles muss synchron gehalten werden → Race Conditions

#### 5. Symptome der Architektur-Schulden
- E2E Tests schlagen fehl wegen fehlender Imports
- Einfache Änderungen benötigen Änderungen in 5+ Dateien
- Debugging ist ein Alptraum durch die vielen Schichten
- Neue Features dauern unverhältnismäßig lang

### Root Cause Analysis

**Grundursache**: Das Projekt wurde wie Enterprise-Software architektiert, obwohl es ein simpler Endgame-Trainer ist.

**YAGNI-Verletzung**: "You Aren't Gonna Need It" - Abstraktionen für Features die nie kommen werden.

---

## 🏗️ Neue Architektur

### Design-Prinzipien

1. **Single Responsibility**: Jeder Service macht genau eine Sache
2. **Single Source of Truth**: chess.js ist die einzige Quelle für Spielzustand
3. **Event-Driven**: Keine Polling-Mechanismen
4. **Dependency Injection**: Services erhalten Dependencies über Constructor
5. **Result Types**: Explizite Fehlerbehandlung statt `null`

### Core Services

#### 1. ChessService
**Verantwortung**: Wrapper um chess.js, Single Source of Truth für Board State

```typescript
class ChessService {
  private chess: Chess;
  private listeners: Set<(snapshot: ChessSnapshot) => void> = new Set();

  // Public API
  loadFen(fen: string): Result<void, FenError>
  makeMove(uci: string): Result<Move, MoveError>
  getFen(): string
  isGameOver(): boolean
  subscribe(listener: (snapshot: ChessSnapshot) => void): Unsubscribe

  // Event emission on state changes
  private emit() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach(listener => listener(snapshot));
  }
}
```

**Warum so?**
- Kapselt chess.js komplett
- Events statt Polling für UI-Updates
- UCI intern, SAN nur an UI-Grenzen
- Alle Schach-Regeln an einer Stelle

#### 2. TablebaseService
**Verantwortung**: Kommunikation mit Tablebase API (Lichess)

```typescript
class TablebaseService {
  private cache = new Map<string, CachedResult>();
  private apiUrl = 'https://tablebase.lichess.ovh/standard';

  async lookup(fen: string): Promise<Result<TablebaseResult, TbError>> {
    // 1. Check cache first
    // 2. HTTP request with timeout (2s)
    // 3. Normalize response
    // 4. Cache result
    // 5. Return Result type
  }
}
```

**Features**:
- In-Memory Cache (Map<FEN, Result>)
- Timeout & Retry Logic
- Rate Limiting Protection
- Result Types für explizite Fehlerbehandlung

#### 3. PositionService
**Verantwortung**: Firebase Firestore Integration für Trainingsstellungen

```typescript
class PositionService {
  constructor(private db: Firestore) {}

  async getRandomPosition(category?: string): Promise<Result<Position, FirebaseError>>
  async getPositionById(id: string): Promise<Result<Position, FirebaseError>>
  async getNextPosition(currentId: string): Promise<Result<Position, FirebaseError>>
}
```

**Firebase Schema**:
```typescript
// Collection: positions
{
  id: string;
  fen: string;
  category: string;           // "KPK", "KQK", etc.
  difficulty: number;         // 1-10
  sideToMove: "w" | "b";     // denormalized for queries
  pieceCount: number;        // for tablebase scope check
  tags: string[];            // ["mate-in-3", "basic"]
  source: "curated" | "lichess" | "custom";
  createdAt: Timestamp;
}
```

#### 4. TrainingCoordinator
**Verantwortung**: Orchestrierung des Trainings-Flows

```typescript
class TrainingCoordinator {
  private state: TrainingState = 'idle';
  
  constructor(
    private chess: ChessService,
    private tablebase: TablebaseService,
    private positions: PositionService
  ) {}

  async startNewSession(): Promise<void>
  async handlePlayerMove(uci: string): Promise<void>
  async loadNextPosition(): Promise<void>
  
  // State Machine
  private async transitionTo(newState: TrainingState): Promise<void>
}

type TrainingState = 
  | 'idle'
  | 'loading'
  | 'waitingForPlayer'
  | 'validatingMove'
  | 'showingFeedback'
  | 'opponentThinking'
  | 'sessionComplete';
```

**State Machine Logic**:
1. `startNewSession` → Load Position → `waitingForPlayer`
2. Player Move → `validatingMove` → Check vs Tablebase
3. If correct → `opponentThinking` → Make Computer Move → `waitingForPlayer`
4. If incorrect → `showingFeedback` → `waitingForPlayer`
5. If game over → `sessionComplete`

---

## 🔄 Migration-Strategie

### Phase 1: Preparation (30 min)
1. **Backup erstellen**: Branch `refactor/clean-architecture`
2. **Alte Dateien identifizieren** für Löschung
3. **Dependencies prüfen**: Welche npm packages behalten/hinzufügen?

### Phase 2: Foundation (1h)
1. **Neue Ordnerstruktur**: `src/core/`, `src/hooks/`
2. **Types definieren**: `Result<T,E>`, Interfaces
3. **Firebase Setup**: Refactor zu `src/firebase/config.ts`

### Phase 3: Core Services (3h)
1. **ChessService**: Event-driven chess.js wrapper
2. **TablebaseService**: Mit Cache und Error Handling
3. **PositionService**: Firebase Firestore Queries
4. **Unit Tests**: Für jeden Service

### Phase 4: Orchestration (2h)
1. **TrainingCoordinator**: State Machine Implementation
2. **Integration Tests**: Service-Zusammenspiel
3. **Error Boundary**: Für unerwartete Fehler

### Phase 5: UI Integration (2h)
1. **React Hooks**: `useChess()`, `useTraining()`
2. **Component Updates**: Logic entfernen, nur UI behalten
3. **Store**: Minimal für UI-State (Toasts, Dialogs)

### Phase 6: Testing & Polish (2h)
1. **E2E Tests**: 1-2 kritische Flows
2. **Performance Check**: Event-Listeners, Memory Leaks
3. **Documentation**: README Update

---

## 💾 State Management

### Neue Strategie: Event-Driven + Minimal Store

#### Chess State (ChessService)
```typescript
interface ChessSnapshot {
  fen: string;
  turn: 'w' | 'b';
  legalMoves: string[];      // UCI format
  gameState: 'playing' | 'checkmate' | 'stalemate' | 'draw';
  history: Move[];
}

// React Hook
function useChess() {
  const [snapshot, setSnapshot] = useState<ChessSnapshot>();
  
  useEffect(() => {
    const unsubscribe = chessService.subscribe(setSnapshot);
    setSnapshot(chessService.getSnapshot());
    return unsubscribe;
  }, []);
  
  return snapshot;
}
```

#### Training State (TrainingCoordinator)
```typescript
interface TrainingSnapshot {
  state: TrainingState;
  currentPosition?: Position;
  feedback?: FeedbackMessage;
  opponentThinking: boolean;
}

// React Hook
function useTraining() {
  const [snapshot, setSnapshot] = useState<TrainingSnapshot>();
  
  useEffect(() => {
    return coordinator.subscribe(setSnapshot);
  }, []);
  
  return {
    ...snapshot,
    makeMove: coordinator.handlePlayerMove,
    nextPosition: coordinator.loadNextPosition,
  };
}
```

#### UI State (Zustand Store)
```typescript
interface UIState {
  showPromotionDialog: boolean;
  toastMessage?: string;
  isLoading: boolean;
  selectedSquare?: string;
}

const useUIStore = create<UIState>(() => ({
  showPromotionDialog: false,
  isLoading: false,
}));
```

**Warum diese Aufteilung?**
- Chess State: Authoritative Source (ChessService)
- Training State: Business Logic (TrainingCoordinator)  
- UI State: Ephemeral, UI-spezifisch (Zustand Store)

---

## 🎯 Technische Entscheidungen

### Move Format: UCI Internal
**Entscheidung**: UCI (e2e4) intern, SAN (Nf3) nur für UI

**Begründung**:
- Tablebase APIs verwenden UCI
- Eindeutig parsbar
- Keine Ambiguität bei Notation

**Implementation**:
```typescript
// Input: User kann SAN eingeben
const moveInput = "Nf3";
const move = chess.move(moveInput);  // chess.js parst SAN
const uci = `${move.from}${move.to}${move.promotion || ''}`;

// Storage: UCI im State und History
state.history.push(uci);

// Display: UCI → SAN für UI
const displayMove = chess.move({ from: 'g1', to: 'f3' }).san; // "Nf3"
```

### Error Handling: Result Types
**Entscheidung**: `Result<T, E>` statt `null` oder Exceptions

**Begründung**:
- Explizite Fehlerbehandlung
- Type-safe
- Keine versteckten `null` Checks

**Implementation**:
```typescript
type Result<T, E extends { code: string; message: string }> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Usage
const result = await tablebaseService.lookup(fen);
if (result.ok) {
  console.log(result.value.bestMove);
} else {
  console.error(result.error.code, result.error.message);
}
```

### Caching Strategy
**Entscheidung**: In-Memory Map mit TTL

**Begründung**:
- Tablebase Queries sind teuer
- Positions wiederholen sich oft
- Memory ist billiger als Network

**Implementation**:
```typescript
interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  
  set(key: string, value: T, ttlMs: number = 600_000) {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }
  
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiry) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }
}
```

### Testing Strategy
**Entscheidung**: Pragmatisch, nicht dogmatisch TDD

**Test Pyramid**:
1. **Unit Tests**: Services isoliert testen
2. **Integration Tests**: Service-Zusammenspiel
3. **E2E Tests**: 1-2 kritische User Flows

**Mock Strategy**:
- TablebaseService: Mock mit festen Responses
- Firebase: Firebase Emulator für Tests
- ChessService: Real chess.js (ist bereits getestet)

---

## 📱 Future Considerations

### Mobile App Integration
**Vorbereitung für später**:
- Services sind Framework-agnostic
- React Hooks können durch native equivalents ersetzt werden
- Firebase funktioniert cross-platform

### User Management
**Schema bereits vorbereitet**:
```typescript
// Collection: users
{
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  stats: {
    sessionsCompleted: number;
    averageAccuracy: number;
    preferredCategories: string[];
  }
}

// Collection: sessions (wird später hinzugefügt)
{
  userId: string;
  positionId: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  moves: string[];  // UCI format
  success: boolean;
  timeSpentMs: number;
}
```

### Offline Support
**Technische Basis**:
- Services können offline/online Modi haben
- Cache kann in localStorage persistiert werden
- Firebase hat offline support

---

## ⚠️ Risiken & Mitigationen

### Risiko 1: Data Loss
**Mitigation**: 
- Branch-basierte Entwicklung
- Firebase Backup vor Migration
- Tests für kritische Flows

### Risiko 2: Performance Regression
**Mitigation**:
- Caching für Tablebase
- Event-driven statt Polling
- Minimal State Updates

### Risiko 3: Integration Issues
**Mitigation**:
- Schritt-für-schritt Implementation
- Integration Tests
- Rollback-Plan

### Risiko 4: Learning Curve
**Mitigation**:
- Ausführliche Dokumentation
- Code Comments
- Progressive Implementation

---

## 📈 Success Metrics

### Code Quality
- [ ] Reduzierung von 2000+ auf ~500 Zeilen Core Logic
- [ ] Elimination von Code-Duplikation
- [ ] 100% TypeScript Strict Mode
- [ ] Test Coverage >80% für Core Services

### Performance
- [ ] UI Updates <16ms (60fps)
- [ ] Tablebase Queries cached
- [ ] Initial Load Time <2s
- [ ] Memory Leaks eliminated

### Developer Experience
- [ ] Build Time <10s
- [ ] Hot Reload funktioniert
- [ ] Tests laufen <5s
- [ ] Debugging ist straightforward

### Feature Parity
- [ ] Alle existierenden Features funktionieren
- [ ] E2E Tests passieren
- [ ] Firebase Integration funktioniert
- [ ] Responsive Design erhalten

---

## 🎯 Conclusion

Dieser Refactor ist notwendig und überfällig. Die aktuelle Architektur arbeitet gegen uns statt für uns. Ein sauberer Neuaufbau mit 3-4 focused Services wird:

1. **Development Speed** massiv verbessern
2. **Code Quality** und Maintainability erhöhen  
3. **Testing** ermöglichen und vereinfachen
4. **Future Features** schneller implementierbar machen

Die Investment in 2-3 Tage Refactoring wird sich langfristig um Wochen amortisieren.

**Next Step**: Siehe `REFACTOR-TODO.md` für die ausführbare Checkliste.