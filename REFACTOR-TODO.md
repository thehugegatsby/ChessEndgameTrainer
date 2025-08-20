# Chess Endgame Trainer - Refactoring Checklist

> **WICHTIG**: Diese Checkliste basiert auf dem ausführlichen `REFACTOR-PLAN.md`. Lies das zuerst für Kontext und Begründungen.

---

## 🚀 Pre-Flight Checklist

### Prerequisites
- [ ] `REFACTOR-PLAN.md` gelesen und verstanden
- [ ] Git Repository ist clean (alle Änderungen committed)
- [ ] Node.js und npm/pnpm installiert
- [ ] Firebase Credentials verfügbar
- [ ] Backup der aktuellen Datenbank erstellt

### Environment Check
```bash
# Verify setup
git status                    # Should be clean
pnpm --version               # Should work
npm run build                # Should complete
npm run test                 # Current tests should pass
```

---

## 📋 Phase 1: Preparation (⏱️ 30 min)

### 1.1 Branch Setup
- [ ] Neuer Branch erstellen:
  ```bash
  git checkout -b refactor/clean-architecture
  git push -u origin refactor/clean-architecture
  ```
- [ ] Working directory sichern:
  ```bash
  git add .
  git commit -m "backup: save current state before refactor"
  ```

### 1.2 Dependency Audit
- [ ] Aktuelle Dependencies dokumentieren:
  ```bash
  cat package.json | grep -A 20 '"dependencies"' > current-deps.txt
  ```
- [ ] Dependencies die bleiben:
  - [ ] ✅ `chess.js` - Core chess logic
  - [ ] ✅ `firebase` - Database
  - [ ] ✅ `react` - UI Framework
  - [ ] ✅ `zustand` - Minimal state management
  - [ ] ✅ `vitest` - Testing
  - [ ] ✅ `playwright` - E2E testing

- [ ] Dependencies die gehen könnten:
  - [ ] ❓ Überprüfe unused dependencies mit: `npx depcheck`

### 1.3 Current State Documentation
- [ ] Screenshots der aktuellen App erstellen
- [ ] Liste der funktionierenden Features:
  - [ ] ✅ Board display
  - [ ] ✅ Move input
  - [ ] ✅ Firebase position loading
  - [ ] ✅ Basic training flow
  - [ ] ✅ Responsive design

---

## 🗑️ Phase 2: Demolition (⏱️ 45 min)

### 2.1 Files to Delete (BE RUTHLESS!)

#### Core Logic Layers (löschen!)
- [ ] `src/domains/game/engine/ChessGameLogic.ts`
- [ ] `src/domains/game/services/GameStateService.ts`
- [ ] `src/domains/game/services/MoveService.ts`
- [ ] `src/shared/services/orchestrator/OrchestratorGameServices.ts`
- [ ] `src/shared/store/orchestrators/handlePlayerMove/index.ts` (500+ Zeilen Monster!)
- [ ] `src/shared/store/orchestrators/handlePlayerMove/MoveValidator.ts`
- [ ] `src/shared/store/orchestrators/handlePlayerMove/MoveQualityEvaluator.ts`
- [ ] `src/shared/store/orchestrators/handlePlayerMove/PawnPromotionHandler.ts`

#### Support Files
- [ ] `src/shared/store/orchestrators/handlePlayerMove/__tests__/` (gesamter Ordner)
- [ ] `src/shared/services/orchestrator/` (gesamter Ordner falls leer)

### 2.2 Verification
```bash
# Verify files are gone
ls -la src/domains/game/engine/
ls -la src/domains/game/services/
ls -la src/shared/store/orchestrators/handlePlayerMove/
```

### 2.3 Compile Check (Should break!)
```bash
pnpm tsc --noEmit
# Expected: Many errors about missing imports
# This is GOOD! We're removing the broken architecture.
```

---

## 🏗️ Phase 3: Foundation (⏱️ 60 min)

### 3.1 New Folder Structure
```bash
mkdir -p src/core/services
mkdir -p src/core/types
mkdir -p src/hooks
mkdir -p src/firebase
```

### 3.2 Create Base Files
- [ ] `src/core/types/index.ts` - Shared types
- [ ] `src/core/types/result.ts` - Result<T,E> type
- [ ] `src/core/services/chess.service.ts` - Chess logic
- [ ] `src/core/services/tablebase.service.ts` - API calls
- [ ] `src/core/services/position.service.ts` - Firebase
- [ ] `src/core/training.coordinator.ts` - Orchestration
- [ ] `src/hooks/useChess.ts` - React hook
- [ ] `src/hooks/useTraining.ts` - React hook
- [ ] `src/firebase/config.ts` - Firebase setup

### 3.3 Base Types Implementation

#### File: `src/core/types/result.ts`
```typescript
export type Result<T, E extends { code: string; message: string }> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function createOk<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function createError<E extends { code: string; message: string }>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

- [ ] ✅ `result.ts` erstellt und getestet

#### File: `src/core/types/index.ts`
```typescript
export * from './result';

export interface Position {
  id: string;
  fen: string;
  category: string;
  difficulty: number;
  sideToMove: 'w' | 'b';
  pieceCount: number;
  tags: string[];
  source: 'curated' | 'lichess' | 'custom';
  createdAt: Date;
}

export interface TablebaseResult {
  bestMove: string;  // UCI format: "e2e4"
  wdl: number;       // Win/Draw/Loss: 2/0/-2
  dtz?: number;      // Distance to Zero
}

export interface ChessSnapshot {
  fen: string;
  turn: 'w' | 'b';
  legalMoves: string[];  // UCI format
  gameState: 'playing' | 'checkmate' | 'stalemate' | 'draw';
  history: string[];     // UCI moves
}

export type TrainingState = 
  | 'idle'
  | 'loading'
  | 'waitingForPlayer'
  | 'validatingMove'
  | 'showingFeedback'
  | 'opponentThinking'
  | 'sessionComplete';

export interface TrainingSnapshot {
  state: TrainingState;
  currentPosition?: Position;
  feedback?: {
    type: 'success' | 'error' | 'hint';
    message: string;
  };
  opponentThinking: boolean;
}
```

- [ ] ✅ `types/index.ts` erstellt

### 3.4 Firebase Configuration

#### File: `src/firebase/config.ts`
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Copy from your existing Firebase config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

- [ ] ✅ Firebase config migriert
- [ ] ✅ Environment variables übertragen

---

## ⚙️ Phase 4: Core Services (⏱️ 3 hours)

### 4.1 ChessService Implementation (⏱️ 60 min)

#### File: `src/core/services/chess.service.ts`
```typescript
import { Chess, Move } from 'chess.js';
import type { ChessSnapshot, Result } from '../types';

export type ChessError = 
  | { code: 'INVALID_FEN'; message: string }
  | { code: 'INVALID_MOVE'; message: string }
  | { code: 'GAME_OVER'; message: string };

export class ChessService {
  private chess: Chess;
  private listeners = new Set<(snapshot: ChessSnapshot) => void>();

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  // State access
  getFen(): string {
    return this.chess.fen();
  }

  getSnapshot(): ChessSnapshot {
    return {
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      legalMoves: this.chess.moves({ verbose: true }).map(m => `${m.from}${m.to}${m.promotion || ''}`),
      gameState: this.getGameState(),
      history: this.chess.history().map(moveObj => {
        const move = moveObj as Move;
        return `${move.from}${move.to}${move.promotion || ''}`;
      })
    };
  }

  // State mutations
  loadFen(fen: string): Result<void, ChessError> {
    try {
      this.chess.load(fen);
      this.emit();
      return { ok: true, value: undefined };
    } catch (error) {
      return { 
        ok: false, 
        error: { 
          code: 'INVALID_FEN', 
          message: `Invalid FEN: ${fen}` 
        } 
      };
    }
  }

  makeMove(uci: string): Result<Move, ChessError> {
    if (this.chess.isGameOver()) {
      return {
        ok: false,
        error: { code: 'GAME_OVER', message: 'Game is already over' }
      };
    }

    try {
      // Parse UCI to move object
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.slice(4, 5) || undefined;

      const move = this.chess.move({ from, to, promotion });
      this.emit();
      return { ok: true, value: move };
    } catch (error) {
      return {
        ok: false,
        error: { code: 'INVALID_MOVE', message: `Invalid move: ${uci}` }
      };
    }
  }

  // Event system
  subscribe(listener: (snapshot: ChessSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach(listener => listener(snapshot));
  }

  private getGameState(): 'playing' | 'checkmate' | 'stalemate' | 'draw' {
    if (this.chess.isCheckmate()) return 'checkmate';
    if (this.chess.isStalemate()) return 'stalemate';
    if (this.chess.isDraw()) return 'draw';
    return 'playing';
  }
}
```

#### Tests: `src/core/services/__tests__/chess.service.test.ts`
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ChessService } from '../chess.service';

describe('ChessService', () => {
  let service: ChessService;

  beforeEach(() => {
    service = new ChessService();
  });

  it('should initialize with starting position', () => {
    const snapshot = service.getSnapshot();
    expect(snapshot.fen).toContain('rnbqkbnr/pppppppp');
    expect(snapshot.turn).toBe('w');
    expect(snapshot.gameState).toBe('playing');
  });

  it('should make valid moves', () => {
    const result = service.makeMove('e2e4');
    expect(result.ok).toBe(true);
    
    const snapshot = service.getSnapshot();
    expect(snapshot.turn).toBe('b');
    expect(snapshot.history).toContain('e2e4');
  });

  it('should reject invalid moves', () => {
    const result = service.makeMove('e2e5');
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('INVALID_MOVE');
  });

  it('should emit events on state changes', () => {
    let emittedSnapshot: any = null;
    service.subscribe(snapshot => emittedSnapshot = snapshot);
    
    service.makeMove('e2e4');
    expect(emittedSnapshot?.turn).toBe('b');
  });
});
```

**Checklist:**
- [ ] ✅ `ChessService` implementiert
- [ ] ✅ Tests geschrieben und grün
- [ ] ✅ Event system funktioniert
- [ ] ✅ UCI parsing korrekt

### 4.2 TablebaseService Implementation (⏱️ 60 min)

#### File: `src/core/services/tablebase.service.ts`
```typescript
import type { TablebaseResult, Result } from '../types';

export type TablebaseError =
  | { code: 'NETWORK_ERROR'; message: string }
  | { code: 'TIMEOUT'; message: string }
  | { code: 'OUT_OF_SCOPE'; message: string }
  | { code: 'INVALID_RESPONSE'; message: string };

interface CacheEntry {
  result: TablebaseResult;
  expiry: number;
}

export class TablebaseService {
  private cache = new Map<string, CacheEntry>();
  private readonly apiUrl = 'https://tablebase.lichess.ovh/standard';
  private readonly timeoutMs = 2000;
  private readonly cacheTtlMs = 600_000; // 10 minutes

  async lookup(fen: string): Promise<Result<TablebaseResult, TablebaseError>> {
    // Check cache first
    const cached = this.getFromCache(fen);
    if (cached) {
      return { ok: true, value: cached };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(
        `${this.apiUrl}?fen=${encodeURIComponent(fen)}`,
        { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 400) {
          return {
            ok: false,
            error: { code: 'OUT_OF_SCOPE', message: 'Position not in tablebase' }
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const result = this.parseResponse(data);
      
      // Cache successful result
      this.cache.set(fen, {
        result,
        expiry: Date.now() + this.cacheTtlMs
      });

      return { ok: true, value: result };

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          ok: false,
          error: { code: 'TIMEOUT', message: 'Request timed out' }
        };
      }
      
      return {
        ok: false,
        error: { 
          code: 'NETWORK_ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private getFromCache(fen: string): TablebaseResult | undefined {
    const entry = this.cache.get(fen);
    if (!entry || Date.now() > entry.expiry) {
      this.cache.delete(fen);
      return undefined;
    }
    return entry.result;
  }

  private parseResponse(data: any): TablebaseResult {
    // Lichess tablebase response format
    if (!data.moves || !Array.isArray(data.moves) || data.moves.length === 0) {
      throw new Error('No moves in response');
    }

    const bestMove = data.moves[0];
    return {
      bestMove: bestMove.uci,
      wdl: data.wdl ?? 0,
      dtz: bestMove.dtz
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}
```

**Checklist:**
- [ ] ✅ `TablebaseService` implementiert
- [ ] ✅ Caching funktioniert
- [ ] ✅ Timeout handling
- [ ] ✅ Error handling mit Result types
- [ ] ✅ Tests geschrieben

### 4.3 PositionService Implementation (⏱️ 60 min)

#### File: `src/core/services/position.service.ts`
```typescript
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Firestore 
} from 'firebase/firestore';
import type { Position, Result } from '../types';

export type PositionError =
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'FIREBASE_ERROR'; message: string }
  | { code: 'NO_POSITIONS'; message: string };

export class PositionService {
  private readonly collectionName = 'positions';

  constructor(private db: Firestore) {}

  async getRandomPosition(category?: string): Promise<Result<Position, PositionError>> {
    try {
      let q = collection(this.db, this.collectionName);
      
      if (category) {
        q = query(q, where('category', '==', category));
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return {
          ok: false,
          error: { 
            code: 'NO_POSITIONS', 
            message: category ? `No positions found for category: ${category}` : 'No positions found'
          }
        };
      }

      // Simple random selection
      const docs = snapshot.docs;
      const randomIndex = Math.floor(Math.random() * docs.length);
      const randomDoc = docs[randomIndex];

      const position: Position = {
        id: randomDoc.id,
        ...randomDoc.data(),
        createdAt: randomDoc.data().createdAt?.toDate() || new Date()
      } as Position;

      return { ok: true, value: position };

    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'FIREBASE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown Firebase error'
        }
      };
    }
  }

  async getPositionById(id: string): Promise<Result<Position, PositionError>> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          ok: false,
          error: { code: 'NOT_FOUND', message: `Position with ID ${id} not found` }
        };
      }

      const position: Position = {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date()
      } as Position;

      return { ok: true, value: position };

    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'FIREBASE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown Firebase error'
        }
      };
    }
  }

  async getPositionsByCategory(
    category: string, 
    limitCount: number = 10
  ): Promise<Result<Position[], PositionError>> {
    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('category', '==', category),
        orderBy('difficulty', 'asc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const positions: Position[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Position[];

      return { ok: true, value: positions };

    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'FIREBASE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown Firebase error'
        }
      };
    }
  }
}
```

**Checklist:**
- [ ] ✅ `PositionService` implementiert
- [ ] ✅ Firebase Firestore integration
- [ ] ✅ Query functions (random, by ID, by category)
- [ ] ✅ Error handling
- [ ] ✅ Tests mit Firebase Emulator

---

## 🎯 Phase 5: Orchestration (⏱️ 2 hours)

### 5.1 TrainingCoordinator Implementation (⏱️ 120 min)

#### File: `src/core/training.coordinator.ts`
```typescript
import type { 
  TrainingState, 
  TrainingSnapshot, 
  Position,
  Result 
} from './types';
import type { ChessService } from './services/chess.service';
import type { TablebaseService } from './services/tablebase.service';
import type { PositionService } from './services/position.service';

export type CoordinatorError =
  | { code: 'INVALID_STATE'; message: string }
  | { code: 'NO_POSITION'; message: string }
  | { code: 'SERVICE_ERROR'; message: string };

export class TrainingCoordinator {
  private state: TrainingState = 'idle';
  private currentPosition?: Position;
  private feedback?: { type: 'success' | 'error' | 'hint'; message: string };
  private opponentThinking = false;
  private listeners = new Set<(snapshot: TrainingSnapshot) => void>();

  constructor(
    private chess: ChessService,
    private tablebase: TablebaseService,
    private positions: PositionService
  ) {
    // Subscribe to chess state changes
    this.chess.subscribe(() => {
      this.emit();
    });
  }

  // Public API
  async startNewSession(category?: string): Promise<Result<void, CoordinatorError>> {
    this.transitionTo('loading');
    
    // Load random position
    const positionResult = await this.positions.getRandomPosition(category);
    if (!positionResult.ok) {
      this.transitionTo('idle');
      return {
        ok: false,
        error: { code: 'SERVICE_ERROR', message: positionResult.error.message }
      };
    }

    this.currentPosition = positionResult.value;
    
    // Load position into chess service
    const loadResult = this.chess.loadFen(this.currentPosition.fen);
    if (!loadResult.ok) {
      this.transitionTo('idle');
      return {
        ok: false,
        error: { code: 'SERVICE_ERROR', message: loadResult.error.message }
      };
    }

    this.feedback = undefined;
    this.transitionTo('waitingForPlayer');
    return { ok: true, value: undefined };
  }

  async handlePlayerMove(uci: string): Promise<Result<void, CoordinatorError>> {
    if (this.state !== 'waitingForPlayer') {
      return {
        ok: false,
        error: { 
          code: 'INVALID_STATE', 
          message: `Cannot handle move in state: ${this.state}` 
        }
      };
    }

    this.transitionTo('validatingMove');

    // Get tablebase evaluation for current position
    const currentFen = this.chess.getFen();
    const tablebaseResult = await this.tablebase.lookup(currentFen);
    
    if (!tablebaseResult.ok) {
      // Tablebase unavailable - just validate move legality
      const moveResult = this.chess.makeMove(uci);
      if (moveResult.ok) {
        this.feedback = { 
          type: 'success', 
          message: 'Move accepted (tablebase unavailable)' 
        };
        this.transitionTo('opponentThinking');
        await this.makeOpponentMove();
      } else {
        this.feedback = { 
          type: 'error', 
          message: 'Invalid move' 
        };
        this.transitionTo('waitingForPlayer');
      }
      return { ok: true, value: undefined };
    }

    // Check if player move matches best move
    const bestMove = tablebaseResult.value.bestMove;
    const isCorrect = uci === bestMove;

    if (isCorrect) {
      // Correct move!
      const moveResult = this.chess.makeMove(uci);
      if (moveResult.ok) {
        this.feedback = { type: 'success', message: 'Correct move!' };
        this.transitionTo('opponentThinking');
        await this.makeOpponentMove();
      } else {
        // This shouldn't happen if tablebase was correct
        this.feedback = { type: 'error', message: 'Move validation error' };
        this.transitionTo('waitingForPlayer');
      }
    } else {
      // Incorrect move
      this.feedback = { 
        type: 'error', 
        message: `Try again. Hint: ${this.formatMoveHint(bestMove)}` 
      };
      this.transitionTo('waitingForPlayer');
    }

    return { ok: true, value: undefined };
  }

  async loadNextPosition(category?: string): Promise<Result<void, CoordinatorError>> {
    return this.startNewSession(category);
  }

  // State access
  getSnapshot(): TrainingSnapshot {
    return {
      state: this.state,
      currentPosition: this.currentPosition,
      feedback: this.feedback,
      opponentThinking: this.opponentThinking
    };
  }

  // Event system
  subscribe(listener: (snapshot: TrainingSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Private methods
  private transitionTo(newState: TrainingState): void {
    this.state = newState;
    this.opponentThinking = newState === 'opponentThinking';
    this.emit();
  }

  private async makeOpponentMove(): Promise<void> {
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Check if game is over
    const chessSnapshot = this.chess.getSnapshot();
    if (chessSnapshot.gameState !== 'playing') {
      this.feedback = { 
        type: 'success', 
        message: `Game over: ${chessSnapshot.gameState}` 
      };
      this.transitionTo('sessionComplete');
      return;
    }

    // Get opponent move from tablebase
    const currentFen = this.chess.getFen();
    const tablebaseResult = await this.tablebase.lookup(currentFen);
    
    if (tablebaseResult.ok) {
      const opponentMove = tablebaseResult.value.bestMove;
      const moveResult = this.chess.makeMove(opponentMove);
      
      if (moveResult.ok) {
        // Check if game is over after opponent move
        const updatedSnapshot = this.chess.getSnapshot();
        if (updatedSnapshot.gameState !== 'playing') {
          this.feedback = { 
            type: 'success', 
            message: `Position complete: ${updatedSnapshot.gameState}` 
          };
          this.transitionTo('sessionComplete');
        } else {
          this.feedback = undefined;
          this.transitionTo('waitingForPlayer');
        }
      } else {
        // Shouldn't happen with correct tablebase
        this.feedback = { type: 'error', message: 'Opponent move error' };
        this.transitionTo('sessionComplete');
      }
    } else {
      // Tablebase unavailable - end session
      this.feedback = { 
        type: 'error', 
        message: 'Cannot continue: tablebase unavailable' 
      };
      this.transitionTo('sessionComplete');
    }
  }

  private formatMoveHint(uci: string): string {
    // Convert UCI to more readable format
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.slice(4);
    
    return promotion ? `${from}-${to}=${promotion.toUpperCase()}` : `${from}-${to}`;
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach(listener => listener(snapshot));
  }
}
```

**Checklist:**
- [ ] ✅ `TrainingCoordinator` implementiert
- [ ] ✅ State machine logic
- [ ] ✅ Tablebase integration
- [ ] ✅ Error handling
- [ ] ✅ Event system
- [ ] ✅ Integration tests

---

## ⚛️ Phase 6: React Integration (⏱️ 2 hours)

### 6.1 React Hooks (⏱️ 60 min)

#### File: `src/hooks/useChess.ts`
```typescript
import { useState, useEffect, useMemo } from 'react';
import { ChessService } from '../core/services/chess.service';
import type { ChessSnapshot } from '../core/types';

export function useChess(initialFen?: string) {
  const chess = useMemo(() => new ChessService(initialFen), [initialFen]);
  const [snapshot, setSnapshot] = useState<ChessSnapshot>(() => chess.getSnapshot());

  useEffect(() => {
    // Subscribe to chess state changes
    const unsubscribe = chess.subscribe(setSnapshot);
    
    // Set initial snapshot
    setSnapshot(chess.getSnapshot());
    
    return unsubscribe;
  }, [chess]);

  return {
    ...snapshot,
    makeMove: chess.makeMove.bind(chess),
    loadFen: chess.loadFen.bind(chess),
    chess
  };
}
```

#### File: `src/hooks/useTraining.ts`
```typescript
import { useState, useEffect, useMemo } from 'react';
import { TrainingCoordinator } from '../core/training.coordinator';
import { ChessService } from '../core/services/chess.service';
import { TablebaseService } from '../core/services/tablebase.service';
import { PositionService } from '../core/services/position.service';
import { db } from '../firebase/config';
import type { TrainingSnapshot } from '../core/types';

export function useTraining() {
  // Create services and coordinator
  const coordinator = useMemo(() => {
    const chess = new ChessService();
    const tablebase = new TablebaseService();
    const positions = new PositionService(db);
    
    return new TrainingCoordinator(chess, tablebase, positions);
  }, []);

  const [snapshot, setSnapshot] = useState<TrainingSnapshot>(() => 
    coordinator.getSnapshot()
  );

  useEffect(() => {
    // Subscribe to training state changes
    const unsubscribe = coordinator.subscribe(setSnapshot);
    
    // Set initial snapshot
    setSnapshot(coordinator.getSnapshot());
    
    return unsubscribe;
  }, [coordinator]);

  return {
    ...snapshot,
    startSession: coordinator.startNewSession.bind(coordinator),
    makeMove: coordinator.handlePlayerMove.bind(coordinator),
    nextPosition: coordinator.loadNextPosition.bind(coordinator),
    coordinator
  };
}
```

### 6.2 Update Main Components (⏱️ 60 min)

#### Example: Updated TrainingPage component
```typescript
// src/pages/TrainingPage.tsx (or wherever your main component is)
import React from 'react';
import { useTraining } from '../hooks/useTraining';
import { useChess } from '../hooks/useChess';

export function TrainingPage() {
  const training = useTraining();
  const chess = useChess();

  const handleSquareClick = (square: string) => {
    // Handle square selection and move making
    // This is simplified - you'll need to adapt to your UI library
  };

  const handleStartTraining = () => {
    training.startSession();
  };

  const handleNextPosition = () => {
    training.nextPosition();
  };

  return (
    <div className="training-page">
      <h1>Chess Endgame Trainer</h1>
      
      {/* Control buttons */}
      <div className="controls">
        <button 
          onClick={handleStartTraining}
          disabled={training.state === 'loading'}
        >
          {training.state === 'loading' ? 'Loading...' : 'Start Training'}
        </button>
        
        <button 
          onClick={handleNextPosition}
          disabled={training.state !== 'sessionComplete'}
        >
          Next Position
        </button>
      </div>

      {/* Status display */}
      <div className="status">
        <p>State: {training.state}</p>
        {training.currentPosition && (
          <p>Position: {training.currentPosition.category}</p>
        )}
        {training.feedback && (
          <div className={`feedback ${training.feedback.type}`}>
            {training.feedback.message}
          </div>
        )}
      </div>

      {/* Chess board */}
      <div className="board-container">
        {/* Your existing ChessBoard component */}
        <ChessBoard 
          position={chess.fen}
          onMove={training.makeMove}
          disabled={training.state !== 'waitingForPlayer'}
        />
      </div>
    </div>
  );
}
```

**Checklist:**
- [ ] ✅ `useChess` hook implementiert
- [ ] ✅ `useTraining` hook implementiert
- [ ] ✅ Main components updated
- [ ] ✅ Event handling funktioniert
- [ ] ✅ UI state reflects service state

---

## 🧪 Phase 7: Testing (⏱️ 2 hours)

### 7.1 Unit Tests (⏱️ 90 min)

Create test files for each service:

#### `src/core/services/__tests__/chess.service.test.ts`
```typescript
// (Already provided above in Phase 4.1)
```

#### `src/core/services/__tests__/tablebase.service.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TablebaseService } from '../tablebase.service';

// Mock fetch
global.fetch = vi.fn();

describe('TablebaseService', () => {
  let service: TablebaseService;

  beforeEach(() => {
    service = new TablebaseService();
    vi.clearAllMocks();
  });

  it('should return cached result on second call', async () => {
    const mockResponse = {
      wdl: 2,
      moves: [{ uci: 'e2e4', dtz: 5 }]
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response);

    // First call
    const result1 = await service.lookup('test-fen');
    expect(result1.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const result2 = await service.lookup('test-fen');
    expect(result2.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1); // No additional call
  });

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const result = await service.lookup('test-fen');
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('NETWORK_ERROR');
  });

  it('should handle timeout', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => 
      new Promise(() => {}) // Never resolves
    );

    const result = await service.lookup('test-fen');
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('TIMEOUT');
  });
});
```

#### `src/core/services/__tests__/position.service.test.ts`
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { PositionService } from '../position.service';
// Mock Firestore for testing
// You'll need to set up Firebase Emulator or mocks
```

### 7.2 Integration Tests (⏱️ 30 min)

#### `src/core/__tests__/training.integration.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrainingCoordinator } from '../training.coordinator';
import { ChessService } from '../services/chess.service';
import { TablebaseService } from '../services/tablebase.service';
import { PositionService } from '../services/position.service';

describe('Training Integration', () => {
  let coordinator: TrainingCoordinator;
  let mockTablebase: TablebaseService;
  let mockPositions: PositionService;

  beforeEach(() => {
    const chess = new ChessService();
    mockTablebase = {
      lookup: vi.fn().mockResolvedValue({
        ok: true,
        value: { bestMove: 'e2e4', wdl: 2, dtz: 5 }
      })
    } as any;
    
    mockPositions = {
      getRandomPosition: vi.fn().mockResolvedValue({
        ok: true,
        value: {
          id: 'test',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          category: 'test'
        }
      })
    } as any;

    coordinator = new TrainingCoordinator(chess, mockTablebase, mockPositions);
  });

  it('should complete training flow correctly', async () => {
    // Start session
    const startResult = await coordinator.startNewSession();
    expect(startResult.ok).toBe(true);
    expect(coordinator.getSnapshot().state).toBe('waitingForPlayer');

    // Make correct move
    const moveResult = await coordinator.handlePlayerMove('e2e4');
    expect(moveResult.ok).toBe(true);
    
    // Should be in opponent thinking state
    const snapshot = coordinator.getSnapshot();
    expect(snapshot.opponentThinking).toBe(true);
  });
});
```

**Checklist:**
- [ ] ✅ Unit tests für alle Services
- [ ] ✅ Integration tests für Coordinator
- [ ] ✅ Tests laufen und sind grün
- [ ] ✅ Test coverage >80%

---

## 🚀 Phase 8: Deployment & Verification (⏱️ 1 hour)

### 8.1 Build Verification (⏱️ 20 min)
```bash
# Clean build
pnpm run build

# Type checking
pnpm tsc --noEmit

# Run all tests
pnpm test

# E2E tests (basic smoke test)
pnpm run test:e2e
```

**Checklist:**
- [ ] ✅ Build erfolgreich
- [ ] ✅ Keine TypeScript Fehler
- [ ] ✅ Alle Tests grün
- [ ] ✅ E2E Tests funktionieren

### 8.2 Feature Verification (⏱️ 20 min)

Manual testing checklist:
- [ ] ✅ App startet ohne Fehler
- [ ] ✅ Board wird korrekt angezeigt
- [ ] ✅ Start Training Button funktioniert
- [ ] ✅ Positions werden von Firebase geladen
- [ ] ✅ Moves können gemacht werden
- [ ] ✅ Feedback wird angezeigt
- [ ] ✅ Tablebase Integration funktioniert
- [ ] ✅ Next Position funktioniert
- [ ] ✅ Responsive Design erhalten

### 8.3 Performance Check (⏱️ 20 min)
```bash
# Bundle size analysis
pnpm run build && npx vite-bundle-analyzer dist

# Performance profiling
# Check DevTools Performance tab
```

**Checklist:**
- [ ] ✅ Bundle size akzeptabel (<2MB)
- [ ] ✅ Initial load time <3s
- [ ] ✅ Move response time <100ms
- [ ] ✅ Memory usage stabil

---

## 📊 Success Metrics & Verification

### Code Quality Metrics
- [ ] **Lines of Code**: Reduziert von ~2000 auf ~500 Zeilen
- [ ] **Cyclomatic Complexity**: Keine Funktionen >10
- [ ] **TypeScript**: 100% strict mode, keine `any` types
- [ ] **Test Coverage**: >80% für Core Services

### Performance Metrics
- [ ] **Build Time**: <30s
- [ ] **Test Execution**: <10s
- [ ] **UI Responsiveness**: 60fps, <16ms updates
- [ ] **API Calls**: Cached, <2s timeout

### Architecture Quality
- [ ] **Single Responsibility**: Jeder Service hat klare Aufgabe
- [ ] **Dependency Injection**: Services sind testbar
- [ ] **Event-Driven**: Keine polling mechanisms
- [ ] **Error Handling**: Result types, keine hidden failures

---

## 🎯 Post-Refactor Tasks

### Immediate (Diese Woche)
- [ ] Documentation Update: README mit neuer Architektur
- [ ] Code Review: Team review der Änderungen
- [ ] Performance Monitoring: Baseline für zukünftige Vergleiche
- [ ] User Testing: Beta test mit realen Nutzern

### Short Term (Nächste 2 Wochen)
- [ ] Additional E2E Tests: Edge cases und error scenarios
- [ ] Performance Optimizations: Bundle splitting, lazy loading
- [ ] Error Tracking: Sentry oder ähnliche Integration
- [ ] Analytics: Tracking für Training Sessions

### Medium Term (Nächster Monat)
- [ ] User Management: Authentication und Progress Tracking
- [ ] Offline Support: Service Worker, cached positions
- [ ] Mobile Optimization: Touch gestures, responsive improvements
- [ ] Advanced Features: Hints, analysis mode, training statistics

---

## 🆘 Rollback Plan

Falls etwas schiefgeht:

### Emergency Rollback
```bash
# Return to previous state
git checkout main
git reset --hard HEAD~1  # If committed
# OR
git checkout previous-working-commit-hash
```

### Partial Rollback
```bash
# Keep new structure, restore specific functionality
git checkout HEAD~1 -- src/specific/broken/file.ts
```

### Service-by-Service Rollback
- Einzelne Services können durch alte Implementierungen ersetzt werden
- Interface-kompatibilität ermöglicht schrittweisen Rollback

---

## 📝 Final Notes

### Important Reminders
- **Backup everything** vor dem Start
- **Tests first** - nichts deployen ohne grüne Tests
- **One service at a time** - nicht alles auf einmal ändern
- **Keep the UI working** - Services können schrittweise ersetzt werden

### Success Indicators
✅ **Clean Build**: Keine Fehler, keine Warnings  
✅ **Fast Tests**: <10s für alle Tests  
✅ **Simple Debugging**: Klare Error Messages, nachvollziehbare Logs  
✅ **Easy Features**: Neue Features dauern Stunden statt Tage  

### Documentation
- [ ] Update README.md
- [ ] API Documentation für Services
- [ ] Architecture Decision Records (ADRs)
- [ ] Onboarding Guide für neue Entwickler

**🎉 ERFOLG GEMESSEN AN**: Wenn das nächste Feature in 30 Minuten statt 3 Stunden implementiert werden kann, war der Refactor erfolgreich!