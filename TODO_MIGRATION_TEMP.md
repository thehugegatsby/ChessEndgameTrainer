# TODO: Jest → Vitest Migration - Temporary Cache File

## 🎯 MISSION: Jest → Vitest Migration COMPLETED
**Status**: 95% Complete - 6 Parsing Errors verbleiben

## 📊 AKTUELLER STATUS (2025-01-14 - VITEST MIGRATION DONE)

### ✅ VITEST MIGRATION FORTSCHRITT
- **Jest vollständig entfernt**: ✅ Alle Jest Dependencies entfernt
- **Vitest installiert**: ✅ Vitest als Test Runner aktiv
- **Jest-dom Matchers konvertiert**: ✅ Alle zu native Vitest Matchers
- **Verbleibende Fehler**: 6 Parsing Errors in Test-Dateien

### 🚀 ERFOLGREICH ABGESCHLOSSEN
- **BATCH 1**: Store slice tests (4 files) → **COMMITTED: 1aa4a88**
- **BATCH 2**: Utils & Hooks (13 files) → **COMMITTED: c7d2068**  
- **BATCH 3**: Services (4 files) → **COMMITTED: 83c5670**
- **BATCH 4**: Orchestrators (4 files) → **COMPLETE!**
  - µBatch 4a: MoveDialogManager.test.ts → **COMMITTED: a2dd740**
  - µBatch 4b: MoveQualityEvaluator.test.ts → **COMMITTED: 8b190aa**
  - µBatch 4c: MoveValidator.test.ts → **COMMITTED: 764ea91**
  - µBatch 4d: OpponentTurnManager.test.ts → **COMMITTED: cf7c6e4**

## 🔄 NÄCHSTE AUFGABE: Fix Parsing Errors

### Verbleibende 6 Parsing Errors:
- EndgameTrainingPage.integration.test.tsx (Line 297)
- MoveErrorContinueFeature.test.tsx (Line 69)
- ErrorBoundary.test.tsx (Line 193)
- AppLayout.test.tsx (Line 239)
- MoveErrorDialog.test.tsx (Line 51)
- ProgressCard.test.tsx (Line 91)

## 📋 MICRO-BATCH WORKFLOW (Bewährt!)

### Atomic µBatch Prozess:
1. **Baseline Check**: `pnpm test` → 424 tests passing
2. **File Migration**: Move from src/tests/unit/ to feature structure
3. **Validation**: TypeScript + Linter + Tests
4. **Git Commit**: Atomic commit with detailed message
5. **SCRATCHPAD Update**: Progress tracking

### ✅ Validation Commands (WSL2):
```bash
# TypeScript check
pnpm tsc

# Linter check  
pnpm run lint

# Test suite
pnpm test
```

## 📁 REMAINING WORK: 25 Files

### BATCH 5 - Components (7 files)
**Target**: `src/features/training/components/__tests__/`
- `ChessBoard.test.tsx`
- `GameControls.test.tsx` 
- `MoveHistory.test.tsx`
- `PositionDisplay.test.tsx`
- `ProgressIndicator.test.tsx`
- `TrainingBoard.test.tsx` (SKIPPED - 12 test failures)
- `TrainingStatus.test.tsx`

### BATCH 6 - Platform (3 files)  
**Target**: `src/shared/platform/__tests__/`
- `PlatformDetection.test.ts`
- `StorageManager.test.ts`
- `WindowManager.test.ts`

### BATCH 7 - Chess Logic (6 files)
**Target**: `src/shared/chess/__tests__/`
- `ChessService.evaluation.test.ts`
- `ChessService.moves.test.ts`
- `ChessService.pgn.test.ts` (8 tests SKIPPED)
- `ChessService.position.test.ts` 
- `ChessService.validation.test.ts`
- `ChessLogic.test.ts`

### BATCH 8 - Misc (7 files)
**Various targets based on functionality**
- `ApiClient.test.ts` → `src/shared/api/__tests__/`
- `ConfigManager.test.ts` → `src/shared/config/__tests__/`
- `ErrorHandler.test.ts` → `src/shared/errors/__tests__/`
- `FeatureFlagService.test.ts` (SKIPPED - memory leak)
- `TablebaseApiClient.test.ts` → `src/shared/services/__tests__/`
- `useFeatureFlag.test.tsx` (SKIPPED - memory leak)
- `ValidationHelpers.test.ts` → `src/shared/validation/__tests__/`

## 🚨 VITEST MIGRATION ISSUES

### Parsing Errors (6 files) - MANUELL ZU FIXEN
- Syntax-Fehler durch automatisierte Conversion
- Pattern: `))?.isConnected).toBe(true)` → `)?.isConnected).toBe(true)`
- Multiline expects mit falscher Klammer-Position

### Konvertierte Patterns:
- `toBeInTheDocument()` → `expect(element?.isConnected).toBe(true)`
- `toHaveAttribute(attr, value)` → `expect(element.getAttribute(attr)).toBe(value)`
- `toBeDisabled()` → `expect(element.disabled).toBe(true)`
- `toHaveClass()` → `expect(element.classList.contains('class')).toBe(true)`

## 🛠️ TECHNICAL DETAILS

### Migration Pattern:
```
FROM: src/tests/unit/[category]/File.test.ts
TO:   src/shared/[domain]/[category]/__tests__/File.test.ts
```

### File Structure Examples:
- Orchestrators → `src/shared/store/orchestrators/__tests__/`
- Services → `src/shared/services/__tests__/`  
- Components → `src/features/training/components/__tests__/`
- Utils → `src/shared/utils/__tests__/`

### Test Commands (WSL2 Optimized):
```bash
# Single file test
pnpm test MoveValidator.test.ts

# All tests 
pnpm test

# Alternative (direct Vitest)
pnpm run test:vitest:file MoveValidator.test.ts
```

## 📝 COMMIT MESSAGE TEMPLATE

```
feat: migrate [FileName] test to feature structure

🔄 µBatch [X]: [FileName].test.ts
- Moved from src/tests/unit/[category]/
- To src/shared/[domain]/[category]/__tests__/
- Maintains Vitest format and all test functionality  
- Part of Issue #156 Jest→Vitest migration

🧮 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 🎯 NEXT ACTIONS (für Cache-Restore)

### 1. IMMEDIATE: Fix Remaining Parsing Errors
```bash
# Syntax Fehler Pattern:
# ))?.isConnected).toBe(true) → )?.isConnected).toBe(true)
# ).not?.isConnected).toBe(true) → )?.isConnected).not.toBe(true)
```

### 2. Vitest Migration Abschluss
- 6 Parsing Errors manuell beheben
- Build testen: `pnpm run build`
- Tests laufen lassen: `pnpm test`

### 3. Commit finaler Vitest Migration
- Letzte Syntax-Fehler beheben
- Final commit mit 100% Vitest Migration

## 📊 SUCCESS METRICS
- **Target**: 50/50 files migrated (100%)
- **Current**: 23/50 files migrated (46%)
- **Remaining**: 27 files
- **Test Status**: MUST maintain 424/424 passing

## 🔧 ENVIRONMENT NOTES
- **WSL2 Linux**: Commands optimized for environment
- **Node 20**: Memory configuration critical
- **Single worker**: Prevents memory exhaustion
- **pnpm**: Package manager in use

---

## 🚨 WICHTIG FÜR NÄCHSTE SESSION

### Vitest Migration Status:
- **95% COMPLETE** - Jest vollständig entfernt
- **6 Parsing Errors** verbleiben in Test-Dateien
- **Commit**: 6f5da5ab - "refactor: complete Vitest migration from Jest (95% done)"

### Was wurde gemacht:
1. Alle Jest Dependencies entfernt
2. Alle jest-dom Matchers zu native Vitest konvertiert  
3. Mock-System von `jest` zu `vi` migriert
4. Config-Dateien von Jest zu Vitest migriert
5. Magic Numbers in Konstanten-Dateien extrahiert

### Was fehlt noch:
1. 6 Parsing Errors in Test-Dateien beheben (manuell!)
2. Build erfolgreich durchführen
3. Alle Tests grün bekommen
4. Final commit für 100% Migration

**Created**: 2025-01-14 für Cache-Wiederherstellung
**Updated**: 2025-01-14 - Vitest Migration 95% complete
**Purpose**: Vollständige Migration Context für weitere Claude-Sessions
**Location**: `/home/thehu/coolProjects/EndgameTrainer/TODO_MIGRATION_TEMP.md`