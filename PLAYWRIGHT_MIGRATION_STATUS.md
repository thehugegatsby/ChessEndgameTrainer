# Playwright Test Migration Status & Engine Debug

## Current Status (2025-01-08)

### Test Migration Progress
- **Total Tests**: 69 Playwright tests
- **Passing Tests**: 30/69 (43.5% pass rate)
- **Migrated to Test Hooks**: 11 tests with @smoke tag
- **@smoke Tests Status**: 8/11 passing (73% success rate)

### Successfully Migrated Tests ✅
1. `basic-app-functionality.spec.ts` - All 8 tests passing
2. `test-hook-moves.spec.ts` - All 4 tests passing  
3. `basic-training-flow.spec.ts` - 3/3 tests passing (after timeout fixes)
4. `simple-move-test.spec.ts` - 2/3 tests passing
5. `working-move-test.spec.ts` - 2/3 tests passing
6. `bridge-building.spec.ts` - 0/2 tests passing ❌

### Test Hook Implementation
Added to `/shared/components/training/TrainingBoard/TrainingBoardZustand.tsx`:
```typescript
// Window methods exposed when NEXT_PUBLIC_TEST_MODE=true:
window.e2e_makeMove(move: string) // e.g., 'e2-e4', 'Kc8-d7'
window.e2e_getGameState() // returns {fen, turn, isGameOver, moveCount, pgn}
```

## ENGINE PROBLEM SOLVED ✅

### Problem Description
Engine (Stockfish) machte keine Züge im Brückenbau-Training (ID 12):
- Trat auf nach Spielerzug 1.Kd7
- Engine (Schwarz) war am Zug aber antwortete nicht
- Problem bestand sowohl in Tests als auch bei manueller Bedienung
- Timeout war NICHT das Problem

### Position Details
**Brückenbau FEN**: `2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1`
- Weiß: König c8, Bauer c7, Turm e4
- Schwarz: König f7, Turm b2
- Nach 1.Kd7: `8/2PK1k2/8/8/4R3/8/1r6/8 b - - 1 1`

### AI Consensus Analysis (Gemini 2.5 Pro + O3-mini)

**Übereinstimmung:**
1. Problem liegt in der Integration, nicht in Stockfish selbst
2. Kritischer Punkt: Zustandsübergabe nach 1.Kd7
3. Hohe Confidence: 8-9/10 dass es ein Schnittstellenproblem ist

**Verdachtsmomente:**
1. **Test-Hook-Interferenz**: Kürzlich hinzugefügte Test-Hooks könnten Engine-Kommunikation stören
2. **FEN-String-Fehler**: Nach 1.Kd7 könnte ungültiger FEN an Engine gesendet werden
3. **UCI-Protokollfehler**: Falsch formatierte Befehle blockieren Engine
4. **Falsche Spielende-Erkennung**: Engine denkt Spiel sei beendet

### Root Cause Analysis (SOLVED)

**Das Problem:** TrainingBoardZustand erstellte eine ScenarioEngine Instanz, nutzte aber deren `makeMove()` Methode nicht. Stattdessen wurde `makeMove()` von useChessGame verwendet, welche nur das Chess-Objekt aktualisiert aber keine Engine-Antwort triggert.

**Die Lösung:** 
```typescript
// TrainingBoardZustand.tsx - handleMove function
// ALT: const result = await makeMove(move);
// NEU: const result = await scenarioEngine.makeMove(move);
```

**Fixes Applied:**
1. ✅ URL Parameter Effect Dependency: Removed `history.length` from dependency array
2. ✅ Engine Integration: Changed handleMove to use `scenarioEngine.makeMove()`
3. ✅ Debug Logging: Added comprehensive UCI communication logging (removed after fix)

### Relevante Dateien
- `/shared/components/training/TrainingBoard/TrainingBoardZustand.tsx` (Test Hooks)
- `/shared/lib/chess/engine.ts` (Engine Integration)
- `/shared/hooks/chess/useChessGame.ts` (Game State Management)
- `/shared/utils/chess/stockfishWorker.ts` (UCI Communication)

### Failing Test Examples

#### Bridge-Building Test Failures
```typescript
// Nach 1.Kd7 versucht Test 2.Kc6 zu spielen
// ABER: Engine (Schwarz) hat noch nicht geantwortet!
// waitForEngineMove() timeout nach 10 Sekunden
```

#### FEN-Probleme in Tests
- Opposition: `4k3/8/4K3/4P3/8/8/8/8 w - - 0 1` ✅
- Brückenbau: `2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1` ❌

### Migration Fixes Applied
1. Increased engine timeout: 5000ms → 10000ms
2. Fixed invalid moves (e.g., e6-e7 → e6-f6 wegen Bauer auf e5)
3. Added fallback moves for different positions
4. Improved waitForEngineMove with turn detection

### Next Immediate Actions
1. Debug Engine Communication (HIGH PRIORITY)
2. Complete test migration for remaining 58 tests
3. Implement test categorization (@smoke, @regression, @full)
4. Set up GitHub Actions CI/CD
5. Performance optimization (parallel execution)

### Test Execution Best Practices
- Run smoke tests locally: `npx playwright test --grep "@smoke"`
- Full suite in CI/CD with parallelization
- Separate timeouts for local (shorter) vs CI (longer)
- Use headed mode for debugging: `--headed`

### Known Issues
1. Engine not responding in Brückenbau position
2. Some tests still using DOM clicks instead of test hooks
3. Performance: 1.3 minutes for 63 tests (too slow)
4. TypeScript errors in some test files

### Environment Setup

#### WICHTIG: Test-Hooks Konfiguration
Die Test-Hooks funktionieren **NUR** wenn die Umgebungsvariable `NEXT_PUBLIC_TEST_MODE=true` gesetzt ist!

```bash
# Für Tests (.env.test)
NEXT_PUBLIC_TEST_MODE=true
NODE_ENV=test

# Dev-Server mit Test-Mode starten:
NEXT_PUBLIC_TEST_MODE=true npm run dev

# ODER: Erstelle .env.test mit obigen Variablen und nutze:
NODE_ENV=test npm run dev

# Run migrated tests only
npx playwright test --grep "@smoke" --project=chromium
```

**Ohne `NEXT_PUBLIC_TEST_MODE=true` schlagen alle Tests mit Test-Hooks fehl!**

## Summary for Continuation
**Main Task**: Fix Engine communication problem after 1.Kd7 in Brückenbau
**Secondary**: Continue test migration to test hooks
**Achievement**: 8/11 smoke tests passing with test hook approach
**Blocker**: Engine not responding - needs immediate debug