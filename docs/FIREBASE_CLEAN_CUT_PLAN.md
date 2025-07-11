# Firebase Clean Cut Migration Plan

## Overview
Complete migration from Dual-Read Pattern to Firestore-only architecture. This plan contains ~120 specific, actionable steps organized in 7 phases.

## Phase Dependencies
```
Phase 1 (Emulator Setup) → Phase 2 (Clean Cut) → Phase 3 (Tests) → Phase 5 (Test Migration)
                                                  ↘ Phase 4 (Components) ↗
                                                  ↘ Phase 6 (Performance) → Phase 7 (Final)
```

## Phase 1: Firebase Emulator Setup & Security (18 steps)

### Setup Firebase Tools
- [ ] 1.1. Check current firebase-tools version: `npm list -g firebase-tools`
- [ ] 1.2. Install/update firebase-tools: `npm install -g firebase-tools@latest`
- [ ] 1.3. Check if firebase.json exists: `ls firebase.json`
- [ ] 1.4. Backup current firebase.json: `cp firebase.json firebase.json.backup`

### Configure Emulator
- [ ] 1.5. If no firebase.json, run: `firebase init` (select ONLY "Emulators")
- [ ] 1.6. In firebase init, select: Firestore Emulator (spacebar to select)
- [ ] 1.7. Accept default port 8080 for Firestore
- [ ] 1.8. Enable Emulator UI
- [ ] 1.9. Accept default port 4000 for Emulator UI

### Add Scripts
- [ ] 1.10. Add to package.json scripts: `"emulator": "firebase emulators:start"`
- [ ] 1.11. Add to package.json scripts: `"emulator:test": "firebase emulators:start --only firestore"`

### Security Rules
- [ ] 1.12. Create firestore.rules if not exists: `touch firestore.rules`
- [ ] 1.13. Write basic security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /positions/{position} {
      allow read: if true;
      allow write: if false;
    }
    match /categories/{category} {
      allow read: if true;
      allow write: if false;
    }
    match /chapters/{chapter} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### Test Emulator
- [ ] 1.14. Test emulator starts: `npm run emulator`
- [ ] 1.15. Open http://localhost:4000 to verify Emulator UI works
- [ ] 1.16. Create test script: `scripts/test-emulator-connection.ts`
- [ ] 1.17. Run connection test: `npx ts-node scripts/test-emulator-connection.ts`
- [ ] 1.18. Commit emulator setup: `git commit -m "Add Firebase emulator configuration"`

## Phase 2: Clean Cut Implementation (24 steps)

### Backup
- [ ] 2.1. Create backup branch: `git checkout -b backup/pre-firebase-cut`
- [ ] 2.2. Return to main: `git checkout main`

### Remove Dual-Read from positionService.ts
- [ ] 2.3. Open `/shared/services/database/positionService.ts`
- [ ] 2.4. Delete line 4: `import { getPositionById as getPositionFromArray`
- [ ] 2.5. Delete line 4: `, allEndgamePositions } from '@shared/data/endgames';`
- [ ] 2.6. Delete lines 19-22: useFirestore check in constructor
- [ ] 2.7. Remove useFirestore property declaration (line 15)

### Clean getPosition method
- [ ] 2.8. In getPosition method, delete lines 33-39 (if !useFirestore block)
- [ ] 2.9. In getPosition method, delete lines 68-74 (Firestore fallback)
- [ ] 2.10. In getPosition method, delete lines 76-83 (error fallback)

### Clean getAllPositions method
- [ ] 2.11. In getAllPositions, delete lines 90-92 (if !useFirestore return)
- [ ] 2.12. In getAllPositions, delete lines 117-120 (empty fallback)
- [ ] 2.13. In getAllPositions error catch, delete array fallback

### Clean other methods
- [ ] 2.14. In getPositionsByCategory, delete line 134 (if !useFirestore)
- [ ] 2.15. In getPositionsByCategory, delete lines 160-163 (fallback)
- [ ] 2.16. In getPositionsByCategory error, remove array fallback
- [ ] 2.17. Repeat 2.14-2.16 for getPositionsByDifficulty
- [ ] 2.18. Repeat 2.14-2.16 for searchPositions

### Verify and cleanup
- [ ] 2.19. Run TypeScript compiler: `npx tsc --noEmit`
- [ ] 2.20. Fix any type errors that appear
- [ ] 2.21. Search for endgames imports: `grep -r "endgames/index" --include="*.ts" --include="*.tsx"`
- [ ] 2.22. Delete /shared/data/endgames directory: `rm -rf shared/data/endgames`
- [ ] 2.23. Run build to verify: `npm run build`
- [ ] 2.24. Commit clean cut: `git commit -m "Remove Dual-Read Pattern - Firestore only"`

## Phase 3: Test Suite Creation (17 steps)

### Setup
- [ ] 3.1. Install test dependencies: `npm install -D @firebase/testing`
- [ ] 3.2. Create directory: `mkdir -p tests/unit/services/firebase`
- [ ] 3.3. Create test file: `touch tests/unit/services/firebase/positionService.test.ts`
- [ ] 3.4. Add imports: `import { positionService } from '@shared/services/database/positionService'`
- [ ] 3.5. Create test helper: `tests/helpers/firebase-test-utils.ts`

### Test Structure
- [ ] 3.6. Add beforeAll hook: Connect to emulator on port 8080
- [ ] 3.7. Add afterEach hook: Clear Firestore data
- [ ] 3.8. Add afterAll hook: Disconnect from emulator

### Write Tests
- [ ] 3.9. Write test: "getPosition returns position from Firestore"
- [ ] 3.10. Write test: "getPosition returns null for non-existent ID"
- [ ] 3.11. Write test: "getPosition validates and sanitizes FEN"
- [ ] 3.12. Write test: "getAllPositions returns all positions"
- [ ] 3.13. Write test: "getPositionsByCategory filters correctly"
- [ ] 3.14. Write test: "getPositionsByDifficulty filters correctly"
- [ ] 3.15. Write test: "searchPositions finds by title and description"
- [ ] 3.16. Write test: "cache works correctly"
- [ ] 3.17. Run tests with emulator: `npm run emulator:test & npm test positionService.test.ts`

## Phase 4: Component Migration (25 steps)

### Find Components
- [ ] 4.1. Find all usages: `grep -r "positionService" --include="*.tsx" --include="*.ts" > components-to-update.txt`
- [ ] 4.2. Find direct imports: `grep -r "endgames/index" --include="*.tsx" > direct-imports.txt`

### Update Each Component
For each component found:
- [ ] 4.3. Open component file
- [ ] 4.4. Identify positionService usage in component
- [ ] 4.5. Convert to useEffect with async function
- [ ] 4.6. Add loading state: `const [loading, setLoading] = useState(true)`
- [ ] 4.7. Add error state: `const [error, setError] = useState<Error | null>(null)`
- [ ] 4.8. Add try-catch around positionService call
- [ ] 4.9. Set loading to false in finally block
- [ ] 4.10. Add loading UI: `{loading && <div>Loading positions...</div>}`
- [ ] 4.11. Add error UI: `{error && <div>Error: {error.message}</div>}`
- [ ] 4.12. Test component manually in browser
- [ ] 4.13. Write unit test for loading state
- [ ] 4.14. Write unit test for error state
- [ ] 4.15. Write unit test for success state
- [ ] 4.16. Commit component update

### Repeat for all components
- [ ] 4.17-4.25. Repeat steps 4.3-4.16 for each component in list

## Phase 5: Test Migration (15 steps)

### Find Old Tests
- [ ] 5.1. Find sync position tests: `grep -r "getPositionById" tests/ > old-tests.txt`
- [ ] 5.2. Find sync array tests: `grep -r "allEndgamePositions" tests/ >> old-tests.txt`
- [ ] 5.3. Review old-tests.txt and identify files to update/delete

### Update Tests
- [ ] 5.4. Delete first old test file
- [ ] 5.5. Run `npm test` to ensure no breaks
- [ ] 5.6. Create async replacement test if needed
- [ ] 5.7. Repeat 5.4-5.6 for each old test
- [ ] 5.8. Update test utilities to use async patterns
- [ ] 5.9. Add waitFor imports from @testing-library/react
- [ ] 5.10. Update mock data to return Promises

### E2E Tests
- [ ] 5.11. Find E2E tests with sync assumptions
- [ ] 5.12. Update E2E helpers to wait for async data
- [ ] 5.13. Run full E2E suite: `npm run test:e2e`
- [ ] 5.14. Fix any failing E2E tests
- [ ] 5.15. Commit all test updates

## Phase 6: Performance & Scale Testing (12 steps)

### Setup Performance Tests
- [ ] 6.1. Create script: `touch scripts/seedFirestoreEmulator.ts`
- [ ] 6.2. Write function to generate test positions
- [ ] 6.3. Add batch write logic (500 items per batch)
- [ ] 6.4. Generate and upload 100 positions to emulator

### Performance Benchmarks
- [ ] 6.5. Create performance test: `tests/performance/firestore-load.test.ts`
- [ ] 6.6. Measure getAllPositions with 100 items
- [ ] 6.7. Assert response time < 500ms
- [ ] 6.8. Generate and upload 1000 positions
- [ ] 6.9. Measure getAllPositions with 1000 items
- [ ] 6.10. Assert response time < 2000ms
- [ ] 6.11. Test concurrent reads (10 parallel requests)
- [ ] 6.12. Document performance benchmarks in PERFORMANCE.md

## Phase 7: Final Validation & Documentation (10 steps)

### Documentation Updates
- [ ] 7.1. Update README.md with Firebase setup instructions
- [ ] 7.2. Update ARCHITECTURE.md to reflect Firestore-only design
- [ ] 7.3. Create MIGRATION_GUIDE.md for the clean cut

### Final Checks
- [ ] 7.4. Run final build: `npm run build`
- [ ] 7.5. Run all tests: `npm test`
- [ ] 7.6. Run linting: `npm run lint`
- [ ] 7.7. Run E2E tests: `npm run test:e2e`
- [ ] 7.8. Create production deployment checklist
- [ ] 7.9. Final review with team
- [ ] 7.10. Merge to main branch

## Rollback Plan

If issues arise during migration:
1. Switch to backup branch: `git checkout backup/pre-firebase-cut`
2. Firebase data remains intact in Firestore
3. Re-enable Dual-Read by reverting Phase 2 commit
4. Investigate issues before retry

## Success Criteria

- [ ] Zero imports from '@shared/data/endgames'
- [ ] All tests pass with Firebase Emulator
- [ ] App works offline with emulator
- [ ] Performance acceptable with 1000+ positions
- [ ] No Firebase config in test files
- [ ] Documentation updated