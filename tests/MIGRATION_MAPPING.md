# Test Migration Mapping

## Übersicht
- **121 Test-Dateien** müssen umstrukturiert werden
- **Priorität 1**: Kritische Evaluation-Tests (Fehlerquelle!)
- **Priorität 2**: Integration Tests
- **Priorität 3**: Saubere Unit Tests

## Mapping-Plan

### 🔴 Priorität 1: Evaluation & Tablebase Tests (Kritischer Pfad!)

| Aktuelle Location | Neue Location | Testtyp | Anmerkung |
|------------------|---------------|---------|-----------|
| `shared/utils/chess/__tests__/evaluationHelpers.test.ts` | `tests/unit/evaluation/evaluationHelpers.test.ts` | Unit | Kern-Logik! |
| `shared/utils/chess/__tests__/evaluationHelpers.comprehensive.test.ts` | `tests/unit/evaluation/evaluationHelpers.comprehensive.test.ts` | Unit | Erweiterte Tests |
| `shared/__tests__/tablebase-evaluation-*.test.ts` (4 Dateien) | `tests/integration/tablebase/` | Integration | Tablebase-Integration |
| `shared/__tests__/integration/tablebaseEvaluationChain.test.ts` | `tests/integration/evaluation/tablebaseEvaluationChain.test.ts` | Integration | Bereits korrekt kategorisiert |
| `shared/lib/chess/evaluation/__tests__/*.test.ts` (11 Dateien) | `tests/unit/evaluation/engine/` | Unit | Engine Evaluation |

### 🟡 Priorität 2: Engine & Worker Tests

| Aktuelle Location | Neue Location | Testtyp |
|------------------|---------------|---------|
| `shared/lib/chess/__tests__/ScenarioEngine.test.ts` | `tests/integration/engine/ScenarioEngine.test.ts` | Integration |
| `shared/lib/chess/engine/*.test.ts` (6 Dateien) | `tests/integration/engine/worker/` | Integration |
| `shared/lib/stockfish.test.ts` | `tests/unit/engine/stockfish.test.ts` | Unit |

### 🟢 Priorität 3: UI Component Tests

| Aktuelle Location | Neue Location | Testtyp |
|------------------|---------------|---------|
| `shared/components/*/__tests__/*.test.tsx` (28 Dateien) | `tests/unit/ui/[component-name]/` | Unit |
| `shared/components/training/MovePanel/__tests__/MovePanel.test.tsx` | `tests/unit/ui/training/MovePanel.test.tsx` | Unit |
| `shared/components/chess/Chessboard.test.tsx` | `tests/unit/ui/chess/Chessboard.test.tsx` | Unit |

### 🔵 E2E Tests (bereits gut organisiert)

| Aktuelle Location | Neue Location | Testtyp |
|------------------|---------------|---------|
| `tests/e2e/performance-benchmark.spec.ts` | `tests/e2e/performance/benchmark.spec.ts` | E2E |
| `shared/__tests__/e2e/completeTrainingFlow.spec.ts` | `tests/e2e/training-flow/completeSession.spec.ts` | E2E |
| Neue Datei | `tests/e2e/regression/knownBlunderScenarios.spec.ts` | E2E |

### 🟣 Performance & Bug Tests

| Aktuelle Location | Neue Location | Testtyp |
|------------------|---------------|---------|
| `shared/__tests__/performance/*.test.ts` (7 Dateien) | `tests/performance/` | Special |
| `shared/__tests__/bugs/*.test.ts` (7 Dateien) | `tests/regression/bugs/` | Mixed |

### ⚫ Aufräumen: Duplikate & Veraltete Tests

| Zu Löschen/Konsolidieren | Grund |
|-------------------------|-------|
| `shared/tests/unit/*` | Duplikat-Struktur, Tests existieren woanders |
| `*.comprehensive.test.ts` | Mit Haupt-Tests zusammenführen |
| Veraltete Mocks | Alte Worker-Mocks updaten |

## Automatisierungs-Skript

```bash
#!/bin/bash
# migration-script.sh

# Phase 1: Backup
echo "Creating backup..."
cp -r shared/__tests__ tests_backup_$(date +%Y%m%d)

# Phase 2: Create new structure
echo "Creating new test structure..."
mkdir -p tests/{unit,integration,e2e,performance,regression}
mkdir -p tests/unit/{evaluation,engine,ui,utils,chess}
mkdir -p tests/integration/{engine,tablebase,training}
mkdir -p tests/e2e/{training-flow,navigation,regression}

# Phase 3: Move priority 1 tests (mit Git, um History zu behalten)
echo "Moving evaluation tests..."
git mv shared/utils/chess/__tests__/evaluationHelpers.test.ts tests/unit/evaluation/
git mv shared/__tests__/tablebase-evaluation-*.test.ts tests/integration/tablebase/

# ... weitere git mv Befehle

# Phase 4: Update imports
echo "Updating import paths..."
find tests -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's|@/|../../shared/|g'

echo "Migration complete! Run 'npm test' to verify."
```