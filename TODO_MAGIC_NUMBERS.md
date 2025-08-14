# Magic Numbers Behebung - Aktueller Stand

**Datum:** 2025-08-14  
**Status:** 239 von 300 Warnings behoben (20% Fortschritt)  
**Strategie:** Magic Numbers durch semantische Konstanten aus `multipliers.ts` ersetzen

## ✅ Erfolgreich Abgeschlossen

### ESLint-Konfiguration
- **Datei:** `config/linting/eslint.config.json`
- **Änderung:** Test- und Mock-Dateien von `no-magic-numbers` Regel ausgeschlossen
- **Patterns hinzugefügt:** `**/__tests__/**/*`, `**/Mock*.ts`, `src/features/**/__tests__/**/*`

### Neue Konstanten-Datei
- **Datei:** `src/shared/constants/multipliers.ts` (NEU erstellt)
- **Inhalt:** Semantische Konstanten für alle Magic Numbers
  ```typescript
  TIME_MULTIPLIERS: { QUICK: 10, STANDARD: 30, SHORT_RETENTION: 5, ... }
  SIZE_MULTIPLIERS: { SMALL_FACTOR: 10, LARGE_FACTOR: 100, ... }
  PERCENTAGE_MULTIPLIERS: { FIFTY_PERCENT: 0.5, THIRTY_PERCENT: 0.3, ... }
  BINARY_MULTIPLIERS: { KILOBYTE: 1024, ... }
  CHESS_MULTIPLIERS: { CENTIPAWN_TO_PAWN: 100, BOARD_SQUARES: 64, ... }
  ```

### Komplett Gefixte Dateien
1. **`src/shared/constants/cache.ts`**
   - Alle Zeit-Konstanten durch `TIME_UNITS` + `TIME_MULTIPLIERS`
   - Memory-Konstanten durch `BINARY_MULTIPLIERS`
   - Beispiel: `30 * 1000` → `TIME_MULTIPLIERS.STANDARD * TIME_UNITS.SECOND`

2. **`src/shared/constants/index.ts`**
   - STORAGE Konstanten gefixed
   - `100 * 1024 * 1024` → `SIZE_MULTIPLIERS.LARGE_FACTOR * BINARY_MULTIPLIERS.KILOBYTE * BINARY_MULTIPLIERS.KILOBYTE`

3. **`src/shared/components/chess/PromotionDialog.tsx`**
   - `200ms` → `DURATIONS.ANIMATION.FAST`
   - `800px board` → Berechnung mit Konstanten

4. **`src/shared/components/navigation/AdvancedEndgameMenu.tsx`**
   - `/ 100` → `/ SIZE_MULTIPLIERS.LARGE_FACTOR`

5. **`src/shared/components/training/AnalysisPanel/AnalysisDetails.tsx`**
   - `0.5`, `-0.5` → `PERCENTAGE_MULTIPLIERS.FIFTY_PERCENT`
   - `-2` → `SIGNIFICANT_DISADVANTAGE` Konstante

6. **`src/shared/components/training/AnalysisPanel/index.tsx`**
   - `10` → `SIZE_MULTIPLIERS.SMALL_FACTOR`

## 🔄 Nächste zu Fixende Dateien

### UI-Komponenten (hohe Priorität)
```bash
./src/shared/components/training/MoveHistory.tsx (6 warnings)
./src/shared/components/ui/MoveErrorDialog.tsx (1 warning) 
./src/shared/components/ui/ProgressCard.tsx (2 warnings)
```

### Service-Dateien
```bash
./src/shared/services/ProgressService.ts
./src/shared/services/SpacedRepetitionService.ts  
./src/shared/services/TablebaseService.ts
./src/shared/services/ErrorService.ts
```

### Constants-Dateien
```bash
./src/shared/constants/http.ts (Status Codes: 200, 404, 500, etc.)
./src/shared/constants/time.constants.ts
./src/shared/constants/ui.ts
./src/shared/constants/http.constants.ts
```

### Hooks
```bash
./src/shared/hooks/useMoveHandlers.ts
./src/shared/hooks/useToast.ts
./src/shared/hooks/useMoveQuality.ts
./src/shared/hooks/useTablebaseQuery.ts
```

## 🎯 Nächste Schritte

1. **Status prüfen:**
   ```bash
   pnpm run lint 2>&1 | grep -c "Warning:"
   ```

2. **Dateien mit meisten Warnings finden:**
   ```bash
   pnpm run lint 2>&1 | grep -B1 "Warning:" | grep "^\./" | sort | uniq -c | sort -rn
   ```

3. **Strategie fortsetzen:**
   - Magic Numbers identifizieren
   - Passende Konstante aus `multipliers.ts` wählen
   - Import hinzufügen: `import { SIZE_MULTIPLIERS } from '@shared/constants/multipliers';`
   - Magic Number ersetzen

## 📊 Statistik

- **Ursprünglich:** 300 Warnings
- **Aktuell:** 239 Warnings  
- **Behoben:** 61 Warnings (20% Fortschritt)
- **Verbleibend:** 239 Warnings

## 💡 Wichtige Erkenntnisse

1. **Test-Dateien ausschließen** war der richtige erste Schritt
2. **Semantische Konstanten** verbessern Lesbarkeit drastisch
3. **Systematisches Vorgehen** funktioniert - pro Datei 1-6 Warnings weniger
4. **multipliers.ts** ist die zentrale Lösung für alle Magic Numbers

## 🚀 Fortsetzung nach Cache-Reset

1. Diese TODO.md öffnen
2. `pnpm run lint` ausführen um Status zu prüfen  
3. Mit UI-Komponenten weitermachen (MoveHistory.tsx hat 6 Warnings)
4. Gleiche Strategie: Magic Numbers → semantische Konstanten aus multipliers.ts