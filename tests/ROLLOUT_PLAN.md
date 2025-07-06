# Test Migration Rollout Plan

## Woche 1: Kritische Pfade (Nach erfolgreichem Pilot)

### Batch 1: Engine & Worker Tests
```bash
# 15 Dateien
git mv shared/lib/chess/__tests__/*.test.ts tests/integration/engine/
git mv shared/lib/chess/engine/__tests__/*.test.ts tests/integration/engine/worker/
git mv shared/services/chess/__tests__/*.test.ts tests/integration/engine/services/
```

### Batch 2: Hooks & State Management
```bash
# 10 Dateien
git mv shared/hooks/__tests__/*.test.ts tests/unit/hooks/
git mv shared/contexts/__tests__/*.test.tsx tests/integration/contexts/
```

## Woche 2: UI Components

### Batch 3: Training Components
```bash
# 12 Dateien
git mv shared/components/training/*/__tests__/*.test.tsx tests/unit/ui/training/
```

### Batch 4: Chess UI Components  
```bash
# 8 Dateien
git mv shared/components/chess/*/__tests__/*.test.tsx tests/unit/ui/chess/
```

## Woche 3: Utilities & Services

### Batch 5: Utility Functions
```bash
# 7 Dateien
git mv shared/utils/*/__tests__/*.test.ts tests/unit/utils/
```

### Batch 6: Services
```bash
# 7 Dateien
git mv shared/services/*/__tests__/*.test.ts tests/unit/services/
```

## Woche 4: Cleanup & Special Cases

### Batch 7: Performance & Regression Tests
```bash
# 14 Dateien
git mv shared/__tests__/performance/*.test.ts tests/performance/
git mv shared/__tests__/bugs/*.test.ts tests/regression/bugs/
```

### Batch 8: Consolidation
- Merge `.comprehensive.test.ts` files with main test files
- Remove duplicate test directory `shared/tests/`
- Update all remaining imports

## CI/CD Pipeline Updates

### Nach Woche 1:
```yaml
# .github/workflows/test-and-coverage.yml
- name: Run Unit Tests
  run: npm run test:unit
  
- name: Run Integration Tests (Critical)
  run: npm run test:integration -- --testPathPattern="evaluation|engine"
```

### Nach Woche 2:
```yaml
- name: Run All Unit Tests
  run: npm run test:unit -- --coverage
  
- name: Run All Integration Tests
  run: npm run test:integration
```

### Nach Woche 4:
```yaml
- name: Run Full Test Suite
  run: |
    npm run test:unit -- --coverage
    npm run test:integration
    npm run test:e2e -- --headed
```

## Success Metrics

- [ ] Week 1: 85%+ tests passing in new structure
- [ ] Week 2: 90%+ tests passing
- [ ] Week 3: 95%+ tests passing
- [ ] Week 4: 100% tests migrated and passing

## Rollback Plan

Falls Probleme auftreten:
1. Tests bleiben in beiden Locations funktionsfähig
2. Git History preserved durch `git mv`
3. Backup in `tests_backup_*` Ordner
4. Schrittweises Rollback möglich per Batch