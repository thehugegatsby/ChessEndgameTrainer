# Immediate Action Plan - Januar 2025

## 🎯 Ziel
Radikale Vereinfachung der Test-Infrastruktur durch Löschung von AppDriver und Fokus auf ModernDriver.

## 📅 3-Wochen-Sprint

### Woche 1: Critical Tests Identification (14.-20. Januar)

**Tag 1-2: Analyse**
- [ ] Gelöschte Legacy-Tests durchgehen (LEGACY_TESTS_TO_REIMPLEMENT.md)
- [ ] Business-kritische Flows identifizieren
- [ ] Mit Product Owner abstimmen

**Tag 3-5: Dokumentation**
- [ ] Top 5 kritische E2E Szenarien dokumentieren:
  1. Engine Integration (Stockfish lädt und antwortet)
  2. Move Making (Züge auf Brett ausführen)
  3. Training Flow (Scenario laden und spielen)
  4. Navigation (Vor/Zurück durch Züge)
  5. Evaluation Display (Engine-Bewertung anzeigen)

### Woche 2: ModernDriver Test Implementation (21.-27. Januar)

**Jeden Tag 1 Test:**
- [x] Tag 1: training-happy-path.spec.ts ✅
- [x] Tag 2: move-evaluation.spec.ts ✅
- [x] Tag 3: error-handling-undo.spec.ts ✅
- [x] Tag 4: scenario-navigation.spec.ts ✅
- [x] Tag 5: session-persistence.spec.ts ✅

**STATUS: ALLE 5 KRITISCHEN TESTS IMPLEMENTIERT!**

**Test-Muster:**
```typescript
import { test, expect } from '@playwright/test';
import { ModernDriver } from './components/ModernDriver';

test.describe('Critical: [Feature Name]', () => {
  let driver: ModernDriver;
  
  test.beforeEach(async ({ page }) => {
    driver = new ModernDriver(page, {
      useTestBridge: true,
      defaultTimeout: 30000
    });
  });
  
  test('[specific scenario]', async () => {
    // Arrange
    await driver.visit('/train/1');
    
    // Act
    await driver.board.makeMove('e2', 'e4');
    
    // Assert
    await expect(driver.board.getPosition()).resolves.toContain('e4');
  });
});
```

### Woche 3: AppDriver Deletion (28. Jan - 3. Feb)

**Tag 1: Verification**
- [ ] Alle 5 Tests grün in CI/CD
- [ ] Performance < 30 Sekunden für alle Tests

**Tag 2-3: Deletion**
- [ ] `rm -rf tests/e2e/components/AppDriver.ts`
- [ ] `rm -rf tests/e2e/components/AppDriver.md`
- [ ] `rm -rf tests/e2e/interfaces/IAppDriver.ts`
- [ ] Alle AppDriver-Referenzen entfernen (18 Dateien)

**Tag 4-5: Cleanup**
- [ ] TODO.md radikal aufräumen
- [ ] Nur noch relevante Tasks behalten
- [ ] Neue Prioritäten setzen

## ⚡ Quick Wins

1. **Logger Mock Migration abschließen**
   - getMockLoggerDefinition() überall nutzen
   - Globalen Mock entfernen

2. **Test Bridge Documentation**
   - Kurzes How-To für neue Tests
   - Best Practices dokumentieren

3. **CI/CD Optimierung**
   - Playwright Workers reduzieren (12 → 4)
   - Parallel Execution optimieren

## 🚫 NICHT machen

- Keine perfekte Architektur anstreben
- Keine 100% Test Coverage
- Keine komplexen Abstraktionen
- Kein Over-Engineering

## 📊 Erfolgs-Metriken

- ✅ 5 kritische E2E Tests mit ModernDriver
- ✅ AppDriver gelöscht
- ✅ Tests < 30 Sekunden
- ✅ TODO.md < 20 Items
- ✅ Keine TypeScript-Fehler

## 🔥 Risiken

1. **Regression in Production**
   - Mitigation: Feature Flags nutzen
   - Rollback-Plan bereit

2. **Fehlende Test Coverage**
   - Akzeptiert für Speed
   - Schrittweiser Ausbau später

## 💡 Langfrist-Vision

Nach diesem Sprint:
- Eine moderne, schnelle Test-Suite
- Klare Architektur ohne Altlasten
- Basis für schnelle Iteration
- Team kann sich auf Features konzentrieren

---

**Mantra:** "Ship fast, iterate later. Perfect is the enemy of good."