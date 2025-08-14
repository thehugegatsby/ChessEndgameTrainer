# TODO: Jest → Vitest Migration - Temporary Cache File

## 🎯 MISSION: Issue #156 Implementation
**Ziel**: Migration aller 50 Unit Tests von src/tests/ zur feature-basierten Struktur

## 📊 AKTUELLER STATUS (2025-01-14)

### ✅ FORTSCHRITT
- **Files migrated**: 23/50 (46%)
- **Tests passing**: 424/424 ✅
- **Current batch**: BATCH 4 - Orchestrators (2/4 completed)

### 🚀 ERFOLGREICH ABGESCHLOSSEN
- **BATCH 1**: Store slice tests (4 files) → **COMMITTED: 1aa4a88**
- **BATCH 2**: Utils & Hooks (13 files) → **COMMITTED: c7d2068**  
- **BATCH 3**: Services (4 files) → **COMMITTED: 83c5670**
- **µBatch 4a**: MoveDialogManager.test.ts → **COMMITTED: a2dd740**
- **µBatch 4b**: MoveQualityEvaluator.test.ts → **COMMITTED: 8b190aa**

## 🔄 AKTUELLE AUFGABE: BATCH 4 - Orchestrators

### BATCH 4 Progress
```
1. ✅ MoveDialogManager.test.ts → COMMITTED: a2dd740
2. ✅ MoveQualityEvaluator.test.ts → COMMITTED: 8b190aa
3. 🔄 MoveValidator.test.ts → NEXT (µBatch 4c - CONFLICT!)
4. ⏳ OpponentTurnManager.test.ts → PENDING (µBatch 4d)
```

### ⚠️ KRITISCH: µBatch 4c - Conflict Resolution
**Problem**: MoveValidator.test.ts bereits in beiden Ordnern vorhanden!

**Locations**:
- `src/tests/unit/orchestrators/MoveValidator.test.ts` (alt, zu migrieren)
- `src/shared/store/orchestrators/__tests__/MoveValidator.test.ts` (bereits existiert)

**Required Action**: Manueller Vergleich und Merge der beiden Dateien erforderlich!

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

## 📁 REMAINING WORK: 27 Files

### BATCH 4 - Orchestrators (2/4 remaining)
- 🔄 `MoveValidator.test.ts` → **CONFLICT RESOLUTION**
- ⏳ `OpponentTurnManager.test.ts`

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

## 🚨 SKIPPED FILES (Separate Fixes Required)

### Memory Leaks (2 files)
- `FeatureFlagService.test.ts` - Global mock cleanup issues
- `useFeatureFlag.test.tsx` - Global mock cleanup issues

### Test Failures (2 files) 
- `TrainingBoard.test.tsx` - 12 failures (mock setup issues)
- `ChessService.pgn.test.ts` - 8 failures (PGN loading issues)

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

### 1. IMMEDIATE: µBatch 4c Conflict Resolution
```bash
# Compare files
diff src/tests/unit/orchestrators/MoveValidator.test.ts src/shared/store/orchestrators/__tests__/MoveValidator.test.ts

# Manual merge required!
# Then delete old file and commit
```

### 2. Continue µBatch 4d
- OpponentTurnManager.test.ts migration

### 3. Plan BATCH 5 (Components)
- Start with simple components first
- Skip TrainingBoard.test.tsx (failing)

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

**Created**: 2025-01-14 für Cache-Wiederherstellung
**Purpose**: Vollständige Migration Context für weitere Claude-Sessions
**Location**: `/home/thehu/coolProjects/EndgameTrainer/TODO_MIGRATION_TEMP.md`