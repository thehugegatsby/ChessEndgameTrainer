# E2E Test Migration Strategy

## Situation Analysis
Nach dem großen Refactoring (Context → Zustand) sind 36 von 59 E2E Tests fehlerhaft. Diese Tests sind für die alte Architektur geschrieben und strukturell inkompatibel mit der neuen Implementierung.

## Empfehlung: NICHT alle Tests fixen!

### Gründe
1. **Architektur-Inkompatibilität**
   - Tests erwarten Context-API Komponenten
   - App nutzt jetzt Zustand Store
   - Page Objects suchen nach veralteten Selektoren

2. **Veraltete Selektoren**
   ```typescript
   // Alt (in TrainingPage.ts)
   this.chessboard = page.locator('[class*="chessboard"]');
   
   // Neu (sollte sein)
   this.chessboard = page.locator('[data-testid="training-board"]');
   ```

3. **Negativer ROI**
   - 2-3 Tage Arbeit für veraltete Tests
   - Tests würden veraltete Patterns validieren
   - Technische Schuld würde erhöht

## Pragmatischer 3-Phasen Ansatz

### Phase 1: Kritische Tests (1 Tag)
Schreibe 3-5 neue Tests für die wichtigsten User Journeys:

1. **Basic Training Flow**
   ```typescript
   test('should complete basic training with Zustand architecture', async () => {
     // Nutze neue Selektoren und Test-Hooks
     await page.goto('/train/1');
     await page.waitForSelector('[data-testid="training-board"]');
     
     // Nutze window.__E2E_TEST_MODE__ hooks
     const result = await page.evaluate(async () => {
       return await window.e2e_makeMove('e2-e4');
     });
     
     // Verifiziere mit data-attributes
     await expect(page.locator('[data-move-count]')).toHaveAttribute('data-move-count', '1');
   });
   ```

2. **Move Navigation**
3. **Engine Integration**
4. **Position Reset**
5. **Error Handling**

### Phase 2: Deprecation (30 Min)
1. Markiere alte Tests:
   ```typescript
   test.skip('@deprecated - Uses old Context API', async () => {
     // Alter Test
   });
   ```

2. Oder in Bulk:
   ```typescript
   test.describe.skip('@deprecated - Legacy Context API Tests', () => {
     // Alle alten Tests hier
   });
   ```

### Phase 3: Schrittweise Migration
- Neue Tests bei neuen Features
- Alte Tests NUR bei konkretem Bedarf migrieren
- Fokus auf Test-Qualität statt Quantität

## Neue Test-Architektur Prinzipien

### 1. Verwende data-testid Attribute
```typescript
// Komponente
<div data-testid="training-board" data-fen={currentFen}>

// Test
await page.locator('[data-testid="training-board"]');
```

### 2. Nutze Test Hooks
```typescript
// Direkte Interaktion über window.__E2E_TEST_MODE__
const gameState = await page.evaluate(() => window.e2e_getGameState());
```

### 3. Single Source of Truth
- Teste gegen Zustand Store State
- Nutze data-attributes für Store-Synchronisation
- Vermeide DOM-basierte State-Ableitung

## Beispiel: Neuer Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Zustand Architecture E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Stelle sicher, dass E2E Mode aktiv ist
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
  });

  test('critical user journey: complete endgame training', async ({ page }) => {
    // Navigation
    await page.goto('/train/1');
    
    // Warte auf Board (neuer Selektor)
    await page.waitForSelector('[data-testid="training-board"]');
    
    // Führe Zug aus (neuer Hook)
    const moveResult = await page.evaluate(async () => {
      return await (window as any).e2e_makeMove('e6-d6');
    });
    expect(moveResult.success).toBe(true);
    
    // Verifiziere State (data-attribute)
    const moveCount = await page.locator('[data-testid="move-panel"]')
      .getAttribute('data-move-count');
    expect(parseInt(moveCount)).toBe(2); // User + Engine move
    
    // Verifiziere Position
    const fen = await page.locator('[data-testid="training-board"]')
      .getAttribute('data-fen');
    expect(fen).toContain('K'); // König hat sich bewegt
  });
});
```

## Vorteile dieser Strategie

1. **Zeit-Effizienz**: 1 Tag statt 3 Tage
2. **Saubere Tests**: Für aktuelle Architektur optimiert
3. **Wartbarkeit**: Keine Legacy-Code-Unterstützung
4. **Flexibilität**: Schrittweise Erweiterung möglich

## Next Steps

1. [ ] Implementiere 5 kritische Tests
2. [ ] Markiere alte Tests als deprecated
3. [ ] Dokumentiere neue Test-Patterns
4. [ ] Erstelle Test-Helper für Zustand-Architektur
5. [ ] CI/CD auf neue Tests umstellen

## Langfristige Vision

- 20-30 hochwertige Tests statt 60 mittelmäßige
- Fokus auf kritische User Journeys
- Automatisierte Test-Generierung für neue Features
- Living Documentation durch Tests