# E2E Test Strategy - Chess Endgame Trainer

## Overview

Unser E2E Test Framework bietet drei spezialisierte Test-Tiers, die verschiedene Abstraktionsebenen und Anwendungsfälle abdecken. Diese Strategie maximiert Test-Stabilität, Geschwindigkeit und Wartbarkeit.

## Die drei Test-Tiers

### 🎯 Tier 1: UI-basierte Tests (Critical User Flows)
**Wann verwenden:** Nur für kritische User-Journeys und UI-spezifische Probleme
**Performance:** Langsam, potenziell fragil
**Coverage:** Vollständige UI-Pipeline inklusive Events, Animationen, Drag&Drop

```typescript
test('User can drag piece to make move', async ({ page }) => {
  await page.goto('/training');
  await page.dragAndDrop('[data-square="e2"]', '[data-square="e4"]');
  await expect(page.locator('[data-square="e4"] .piece')).toBeVisible();
});
```

**Verwende Tier 1 für:**
- ✅ Drag & Drop funktioniert
- ✅ Buttons sind klickbar und reagieren
- ✅ Animationen laufen ab
- ✅ Dialoge öffnen/schließen sich
- ✅ Critical Path Testing (1-2 Tests pro Feature)

**Verwende Tier 1 NICHT für:**
- ❌ Komplexe Zugvalidierung
- ❌ Game State Assertions
- ❌ Edge Cases testen
- ❌ Performance Tests

### ⚡ Tier 2: API-basierte Tests (Standard für 90% aller Tests)
**Wann verwenden:** Der Standard für fast alle Tests
**Performance:** Schnell, stabil, deterministisch
**Coverage:** Vollständige Logik-Pipeline durch `handlePlayerMove` orchestrator

```typescript
test('En passant capture works correctly', async ({ page }) => {
  await page.goto('/training');
  
  // Setup position for en passant
  await page.evaluate(() => window.e2e_setPosition('rnbqkbnr/pppp1ppp/8/4pP2/8/8/PPPP1PPP/RNBQKBNR w KQkq e6'));
  
  // Execute en passant
  const result = await page.evaluate(() => window.e2e_makeValidatedMove('f5-e6'));
  expect(result.success).toBe(true);
  
  // Verify game state
  const gameState = await page.evaluate(() => window.e2e_getGameState());
  expect(gameState.fen).toContain('rnbqkbnr/pppp1ppp/4P3/8/8/8/PPPP1PPP/RNBQKBNR b KQkq -');
});
```

**Verwende Tier 2 für:**
- ✅ Zugvalidierung (legal/illegal moves)
- ✅ Spielregeln (En Passant, Rochade, Bauernumwandlung)
- ✅ Game State Validierung (FEN, PGN, moveHistory)
- ✅ Training Logic (Streak, Hints, Mistakes)
- ✅ Edge Cases und Regression Tests
- ✅ Tablebase Integration Tests

**API Reference:**
- `window.e2e_makeValidatedMove(move)` - Macht Zug durch volle Pipeline
- `window.e2e_getGameState()` - Holt kompletten Spielzustand
- `window.e2e_setPosition(fen)` - Setzt Brett-Position
- `window.e2e_resetGame()` - Reset auf Ausgangszustand

### 🚀 Tier 3: URL-basierte Tests (Setup & Initialization)
**Wann verwenden:** Nur zur schnellen Initialisierung komplexer Positionen
**Performance:** Sehr schnell
**Coverage:** Setup-Phase, keine Interaktion

```typescript
test('Endgame position loads correctly', async ({ page }) => {
  // Setup complex endgame position via URL
  await page.goto('/training?moves=e4,e5,Nf3,Nc6,Bb5,a6,Ba4,Nf6');
  
  const gameState = await page.evaluate(() => window.e2e_getGameState());
  expect(gameState.moveCount).toBe(8);
  expect(gameState.fen).toContain('Spanish Opening position');
});
```

**Verwende Tier 3 für:**
- ✅ Setup komplexer Ausgangspositionen
- ✅ Integration mit bestehenden URL-Routen
- ✅ Schnelle Initialisierung für andere Tests

**Verwende Tier 3 NICHT für:**
- ❌ Primäre Test-Interaktion
- ❌ Move-by-move Validierung
- ❌ Komplexe State Assertions

## Entscheidungsbaum: Welchen Tier verwenden?

```
Ist es ein UI-spezifisches Problem? (Drag, Animation, Visual Feedback)
├─ JA: Tier 1 (UI-basiert)
└─ NEIN: 
   ├─ Brauchst du nur Setup einer komplexen Position?
   │  └─ JA: Tier 3 (URL-basiert)
   └─ NEIN: Tier 2 (API-basiert) ← DEFAULT CHOICE
```

## Performance Guidelines

| Test Typ | Anzahl | Ausführungszeit | Zweck |
|----------|--------|----------------|-------|
| Tier 1 (UI) | 5-10 pro Feature | 2-5s pro Test | Critical Path Coverage |
| Tier 2 (API) | 50-100 pro Feature | 0.1-0.5s pro Test | Logic & Edge Cases |
| Tier 3 (URL) | Nach Bedarf | 0.1s pro Setup | Position Initialization |

## Chess-spezifische Test Patterns

### Zugvalidierung Pattern
```typescript
// Prüfe illegalen Zug
const invalidResult = await page.evaluate(() => 
  window.e2e_makeValidatedMove('e1-e8') // König kann nicht 7 Felder
);
expect(invalidResult.success).toBe(false);
expect(invalidResult.error).toContain('Invalid move');
```

### Spielende Pattern
```typescript
// Prüfe Checkmate Detection
await page.evaluate(() => window.e2e_setPosition('8/8/8/8/8/8/5PPP/4K1kr w - - 0 1'));
const gameState = await page.evaluate(() => window.e2e_getGameState());
expect(gameState.isCheckmate).toBe(true);
expect(gameState.gameOverReason).toBe('checkmate');
```

### Tablebase Integration Pattern
```typescript
// Mock deterministic tablebase response
await page.evaluate(() => {
  window.e2e_configureTablebase({
    deterministic: true,
    fixedResponses: new Map([
      ['8/8/8/8/8/3K4/8/3k4 w - - 0 1', 'Kd4'] // Always play Kd4
    ])
  });
});
```

## Debugging Guidelines

### Test schlägt fehl - Debugging Reihenfolge

1. **Tier 2 Test schreiben** - Isoliere die Logik
2. **Tier 1 Test schlägt fehl, Tier 2 läuft** - UI Problem
3. **Beide schlagen fehl** - Logic Problem
4. **Console Logs checken** - Event-System liefert Details
5. **Screenshots & Videos** - Playwright erstellt automatisch

### Häufige Probleme

| Problem | Ursache | Lösung |
|---------|---------|--------|
| `e2e_makeValidatedMove not available` | Test API nicht initialisiert | Check NEXT_PUBLIC_IS_E2E_TEST=true |
| Test hängt bei `await move` | Async Operation wartet | Use Event System oder Timeout |
| Flaky UI Tests | Race Conditions | Switch zu Tier 2 oder füge Waits hinzu |

## Migration von alten Tests

### Alt (nur URL-Parameter)
```typescript
test('old test', async ({ page }) => {
  await page.goto('/training?moves=e4,e5,Nf3');
  // Test logic here
});
```

### Neu (Tier 2 + 3 Kombination)
```typescript
test('new test', async ({ page }) => {
  // Tier 3: Setup
  await page.goto('/training?moves=e4,e5');
  
  // Tier 2: Interaction & Validation
  const result = await page.evaluate(() => window.e2e_makeValidatedMove('Nf3'));
  expect(result.success).toBe(true);
  
  const gameState = await page.evaluate(() => window.e2e_getGameState());
  expect(gameState.moveCount).toBe(3);
});
```

## Fazit

Dieses Test-Framework ist eine **Investition in Stabilität und Skalierbarkeit**. Die drei Tiers lösen verschiedene Probleme:

- **Tier 1** gibt Vertrauen in die UI
- **Tier 2** gibt Vertrauen in die Logik  
- **Tier 3** beschleunigt komplexe Setups

**Die 90/10 Regel:** 90% aller Tests sollten Tier 2 sein, 10% Tier 1 für kritische Flows.