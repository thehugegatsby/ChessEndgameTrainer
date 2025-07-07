# 🚨 Sofortmaßnahmen - Woche 1

**Priorität**: KRITISCH  
**Zeitrahmen**: < 1 Woche  
**Fokus**: Security, Bug-Fixes, Dokumentation  

## 1. Security Fix - FEN Validation implementieren

### Problem
FEN-Validator existiert aber wird NICHT verwendet → XSS-Risiko

### Tasks
- [ ] **Task 1.1**: FEN Validation in ScenarioEngine einbauen
  ```typescript
  // File: /shared/lib/chess/ScenarioEngine/index.ts
  // Add import at top
  import { validateAndSanitizeFen } from '@shared/utils/fenValidator';
  
  // Update constructor (line ~72)
  constructor(startingFen: string) {
    const { isValid, sanitized, errors } = validateAndSanitizeFen(startingFen);
    if (!isValid) {
      throw new Error(`Invalid FEN: ${errors.join(', ')}`);
    }
    this.initialFen = sanitized;
    this.chess = InstanceManager.createChessInstance(sanitized);
    // ...
  }
  
  // Update updatePosition method (line ~107)
  public updatePosition(fen: string): void {
    const { isValid, sanitized, errors } = validateAndSanitizeFen(fen);
    if (!isValid) {
      throw new Error(`Invalid FEN: ${errors.join(', ')}`);
    }
    InstanceManager.updateChessPosition(this.chess, sanitized);
  }
  ```

- [ ] **Task 1.2**: Tests für FEN Validation schreiben
  ```typescript
  // Create: /tests/unit/chess/ScenarioEngine.security.test.ts
  describe('ScenarioEngine Security', () => {
    it('should reject XSS attempts in FEN', () => {
      const maliciousFen = '<script>alert("XSS")</script>';
      expect(() => new ScenarioEngine(maliciousFen)).toThrow('Invalid FEN');
    });
    
    it('should sanitize HTML entities in FEN', () => {
      const fenWithHtml = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1<>';
      const engine = new ScenarioEngine(fenWithHtml);
      expect(engine.getFen()).not.toContain('<>');
    });
  });
  ```

- [ ] **Task 1.3**: Alle FEN-Input-Stellen prüfen
  - Grep für `new Chess(` und `.load(` 
  - Jede Stelle mit Validation absichern
  - Checklist erstellen

### Acceptance Criteria
- Keine unsanitized FEN inputs mehr im Code
- Security Tests grün
- Kein Performance-Impact (< 1ms overhead)

---

## 2. TrainingBoardZustand Infinite Loop Fix

### Problem
Tests schlagen fehl mit "Maximum update depth exceeded" - 3 Tests übersprungen

### Tasks
- [ ] **Task 2.1**: Root Cause Analysis
  ```typescript
  // File: /shared/components/training/TrainingBoard/TrainingBoardZustand.tsx
  // Problem in useEffect with setGame
  
  // Current (problematic):
  useEffect(() => {
    setGame(game);  // This might trigger re-render → new game → loop
  }, [game, setGame]);
  
  // Fix Option 1: Use useRef for game instance
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);
  
  // Fix Option 2: Memoize game instance
  const memoizedGame = useMemo(() => game, [game.fen()]);
  
  // Fix Option 3: Check for actual changes
  useEffect(() => {
    const currentFen = getCurrentPosition();
    if (game.fen() !== currentFen) {
      setGame(game);
    }
  }, [game.fen()]);
  ```

- [ ] **Task 2.2**: Tests wieder aktivieren
  ```typescript
  // File: /tests/unit/components/TrainingBoardZustand.test.tsx
  // Remove .skip from these tests:
  // - "should set position in Zustand store on mount"
  // - "should update Zustand when making a move"
  // - "should handle game completion through onComplete callback"
  ```

- [ ] **Task 2.3**: Regression Tests hinzufügen
  - Test für re-render cycles
  - Performance Test (max renders < 5)

### Acceptance Criteria
- Alle 3 Tests laufen wieder grün
- Keine infinite loops
- Performance nicht beeinträchtigt

---

## 3. Dokumentation synchronisieren

### Problem
Inkonsistente Informationen zwischen README.md, CLAUDE.md und tatsächlichem Code

### Tasks
- [ ] **Task 3.1**: Port-Nummer vereinheitlichen
  - Überall auf Port 3002 (wie in package.json) ändern
  - README.md: Zeile 101
  - CLAUDE.md: Zeile 56
  - Alle anderen Erwähnungen

- [ ] **Task 3.2**: Test-Zahlen aktualisieren
  ```markdown
  # In README.md und CLAUDE.md:
  - Test Coverage: ~78% (Statement Coverage)
  - Test Success: 100% (alle Tests bestehen)
  - Tests Total: [Aktuelle Zahl aus npm test]
  ```

- [ ] **Task 3.3**: Endspiel-Positionen klarstellen
  ```markdown
  # Einheitlich dokumentieren:
  - Implementiert: 7 Positionen
  - Geplant: 16 Positionen
  - Erweiterbar auf: 50+ Positionen
  ```

- [ ] **Task 3.4**: chess.ts Zeilen korrigieren
  ```markdown
  # In CLAUDE.md, Zeile 123:
  - ALT: `types/chess.ts` hat jetzt 91 Zeilen (nicht mehr "nur 5")
  - NEU: `types/chess.ts` hat 91 Zeilen mit umfassenden Type Definitions
  ```

### Acceptance Criteria
- Keine widersprüchlichen Zahlen mehr
- Alle Ports einheitlich dokumentiert
- Klare Aussagen zu implementierten Features

---

## 4. Cleanup veralteter Artefakte

### Tasks
- [ ] **Task 4.1**: Doppelte Migration Reports
  ```bash
  # Einen behalten, anderen archivieren:
  mkdir -p archive/migrations
  mv docs/migration-reports/zustand-migration-2025-01-07.md archive/migrations/
  # Keep: zustand-migration-final-2025-01-07.md
  ```

- [ ] **Task 4.2**: Nicht-existierende Referenzen entfernen
  - CLAUDE.md: Entferne Referenz zu "ARCHITECTURE_ANALYSIS.md"
  - CLAUDE.md: Entferne oder erstelle "archive/" Ordner

- [ ] **Task 4.3**: Zukunftsdaten korrigieren
  - Suche nach "2025-07-07" und korrigiere zu "2025-01-07"
  - Betrifft mehrere Dateien in docs/

### Acceptance Criteria
- Keine toten Links in Dokumentation
- Keine doppelten Dateien
- Korrekte Datumsangaben

---

## 5. Quick Security Audit

### Tasks
- [ ] **Task 5.1**: Security Headers Check
  ```typescript
  // Create: /shared/config/security.ts
  export const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'; worker-src 'self' blob:;",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
  ```

- [ ] **Task 5.2**: Environment Variables Audit
  - Check .env.example für alle required vars
  - Keine secrets in Code
  - Dokumentiere alle env vars

### Acceptance Criteria
- Security config dokumentiert
- Keine hardcoded secrets
- CSP für Stockfish WASM funktioniert

---

## 📊 Erfolgs-Metriken

Nach Woche 1 sollten:
- [ ] 0 Security Vulnerabilities (FEN validation)
- [ ] 100% Tests grün (keine skipped tests)
- [ ] 0 Dokumentations-Inkonsistenzen
- [ ] Security Headers konfiguriert

## ⏱️ Zeitschätzung

| Task | Geschätzte Zeit | Priorität |
|------|----------------|-----------|
| Security Fix | 4h | KRITISCH |
| Infinite Loop | 3h | HOCH |
| Dokumentation | 2h | MITTEL |
| Cleanup | 1h | NIEDRIG |
| Security Audit | 2h | HOCH |
| **TOTAL** | **12h** | |

## 🚀 Getting Started

```bash
# 1. Branch erstellen
git checkout -b fix/week1-critical-fixes

# 2. Tests laufen lassen (Baseline)
npm test

# 3. Security Fix zuerst
# ... implement FEN validation ...

# 4. Tests wieder grün machen
npm test

# 5. Commit nach jedem Fix
git commit -m "fix: Add FEN validation to prevent XSS"
```

---

**Deadline**: Ende Woche 1  
**Review**: Nach jedem abgeschlossenen Task  
**Merge Strategy**: Ein PR pro Hauptaufgabe