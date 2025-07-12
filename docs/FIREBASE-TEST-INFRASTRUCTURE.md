# Firebase Test Infrastructure Documentation

## Overview

The Firebase Test Infrastructure provides comprehensive testing capabilities for Firebase-integrated features in the ChessEndgameTrainer application. It includes emulator integration, test fixtures, data seeding, and isolation verification.

## Architecture

### Directory Structure
```
tests/
├── e2e/
│   ├── firebase/                    # Firebase-specific tests
│   │   ├── firebase.constants.ts    # Configuration constants
│   │   ├── firebase-test-helpers.ts # Core helper functions
│   │   ├── position-service.spec.ts # Integration tests
│   │   ├── position-service-edge-cases.spec.ts
│   │   ├── position-service-performance.spec.ts
│   │   └── isolation-verification.spec.ts
│   ├── firebase-test-fixture.ts     # Extended Playwright fixture
│   └── global-setup.ts              # Emulator lifecycle management
├── pages/
│   └── FirestoreDebugPage.ts        # Page Object for Firestore debugging
└── utils/
    └── firebase-emulator-api.ts     # Emulator management utilities
```

## Key Components

### 1. Firebase Test Fixture (`firebase-test-fixture.ts`)

Extended Playwright test fixture providing:
- **FirebaseAuthHelper**: User authentication and token generation
- **FirebaseDataHelper**: Data seeding and integrity verification
- **Automatic cleanup**: Ensures test isolation

```typescript
import { test, expect } from '../firebase-test-fixture';

test('example test', async ({ firebaseAuth, firebaseData }) => {
  // Create test user
  const { user } = await firebaseAuth.createUser({ template: 'BEGINNER' });
  
  // Seed test data
  await firebaseData.seedBatch({ positions: testPositions });
  
  // Test runs with isolated data
  // Cleanup happens automatically after test
});
```

### 2. Firebase Emulator Management

#### Global Setup (`global-setup.ts`)
- Starts Firebase emulator before all tests
- Ensures single emulator instance
- Handles graceful shutdown

#### Emulator API (`firebase-emulator-api.ts`)
- Health check monitoring
- Status verification
- Retry logic with exponential backoff

### 3. Test Helpers (`firebase-test-helpers.ts`)

Provides utilities for:
- User template generation
- Test data factories
- ID generation
- Scenario builders

```typescript
// Generate test user
const user = createTestUser('INTERMEDIATE', {
  progress: { 1: { completed: true, bestScore: 100 } }
});

// Generate test position
const position = createTestPosition({
  id: 1,
  title: 'Custom Position',
  difficulty: 'advanced'
});
```

### 4. Page Objects

#### FirestoreDebugPage
Professional Page Object for Firestore debugging:
- Connection status verification
- Data statistics retrieval
- Integrity validation
- Data operations (seed, clear, verify)

```typescript
const debugPage = new FirestoreDebugPage(page);
await debugPage.navigateToDebugPage();

const stats = await debugPage.getDataStatistics();
expect(stats.positionsCount).toBeGreaterThan(0);
```

## Test Categories

### 1. Integration Tests (`position-service.spec.ts`)
- Complete positionService method coverage
- Real Firestore queries
- Cache behavior validation
- Navigation and search functionality

### 2. Edge Cases (`position-service-edge-cases.spec.ts`)
- FEN validation scenarios
- Empty database handling
- Boundary value testing
- Unicode and special characters
- Concurrent access patterns

### 3. Performance Tests (`position-service-performance.spec.ts`)
- Response time validation (< 2s single, < 10s bulk)
- Cache efficiency (90% threshold)
- Concurrent request handling (50 simultaneous)
- Scalability testing (up to 500 positions)
- Memory management verification

### 4. Isolation Tests (`isolation-verification.spec.ts`)
- Service instance independence
- Test-to-test isolation
- Cache management verification
- Memory leak prevention
- State consistency validation

## Configuration

### Environment Variables
```env
FIREBASE_EMULATOR_HOST=127.0.0.1
FIRESTORE_EMULATOR_PORT=8080
FIREBASE_AUTH_EMULATOR_PORT=9099
FIREBASE_PROJECT_ID=chess-endgame-trainer-test
```

### Test Timeouts
```typescript
export const TEST_TIMEOUTS = {
  EMULATOR_START: 30000,    // 30 seconds
  EMULATOR_READY: 10000,    // 10 seconds
  DATA_SEED: 15000,         // 15 seconds
  LARGE_OPERATION: 30000    // 30 seconds
};
```

## Usage Examples

### Basic Test Setup
```typescript
import { test, expect } from '../firebase-test-fixture';

test.describe('Feature Tests', () => {
  test('should test with Firebase data', async ({ firebaseData, apiClient }) => {
    // Seed test data
    await firebaseData.seedBatch({
      positions: [createTestPosition({ id: 1 })],
      categories: [createTestCategory({ id: 'test' })]
    });
    
    // Verify data exists
    const status = await apiClient.getFirebaseStatus();
    expect(status.collections.positions).toBe(1);
    
    // Test your feature
    // ...
    
    // Cleanup happens automatically
  });
});
```

### Authentication Testing
```typescript
test('should handle authenticated users', async ({ firebaseAuth }) => {
  // Create user with custom claims
  const { user, token } = await firebaseAuth.createUser({
    template: 'ADVANCED',
    customClaims: { admin: true },
    autoLogin: true
  });
  
  expect(user.uid).toBeTruthy();
  expect(token).toBeTruthy();
  
  // Set custom claims
  await firebaseAuth.setCustomClaims(user.uid, { 
    role: 'premium' 
  });
});
```

### Performance Testing
```typescript
test('should handle large datasets', async ({ firebaseData }) => {
  // Generate large dataset
  const positions = Array.from({ length: 100 }, (_, i) => 
    createTestPosition({ id: i + 1 })
  );
  
  // Seed with performance measurement
  const startTime = Date.now();
  await firebaseData.seedBatch({ positions });
  const seedTime = Date.now() - startTime;
  
  expect(seedTime).toBeLessThan(TEST_TIMEOUTS.LARGE_OPERATION);
});
```

## Best Practices

### 1. Test Isolation
- Always start with clean state
- Use `firebaseData.clearAll()` if needed
- Let automatic cleanup handle post-test state

### 2. Data Seeding
- Use batch operations for performance
- Leverage test helpers for consistent data
- Verify data integrity after seeding

### 3. Performance Considerations
- Set appropriate timeouts for operations
- Use concurrent operations where possible
- Monitor emulator resource usage

### 4. Error Handling
- Check emulator status before tests
- Handle network failures gracefully
- Use retry logic for flaky operations

## Troubleshooting

### Common Issues

1. **Emulator not starting**
   - Check if port 8080/9099 are available
   - Verify Firebase CLI is installed
   - Check emulator logs in console

2. **Test isolation failures**
   - Ensure automatic cleanup is enabled
   - Check for manual cache clearing
   - Verify service instance independence

3. **Performance issues**
   - Reduce dataset sizes for CI/CD
   - Use selective test execution
   - Monitor emulator memory usage

### Debug Commands
```bash
# Check emulator status
curl http://localhost:8080

# View emulator UI
open http://localhost:4000

# Clear emulator data manually
curl -X DELETE http://localhost:8080/emulator/v1/projects/chess-endgame-trainer-test/databases/(default)/documents
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Start Firebase Emulator
  run: |
    npm install -g firebase-tools
    firebase emulators:start --only firestore,auth &
    npx wait-on http://localhost:8080
    
- name: Run Firebase Tests
  run: npm run test:firebase
  
- name: Stop Emulator
  if: always()
  run: pkill -f "firebase emulators" || true
```

## Future Enhancements

1. **Storage Emulator Integration**
   - Add Firebase Storage support
   - Test file upload/download

2. **Realtime Database Support**
   - Extend fixtures for RTDB
   - Add synchronization tests

3. **Security Rules Testing**
   - Validate Firestore rules
   - Test authentication scenarios

4. **Performance Monitoring**
   - Add metrics collection
   - Generate performance reports

## Recent Updates

### TypeScript Compatibility (2025-07-12)

Fixed all TypeScript errors in the test infrastructure:

1. **Type Alignment**: Removed properties not defined in interfaces:
   - `lessonNumber`, `chapterNumber`, `tags` from EndgamePosition
   - `positionCount`, `estimatedTime`, `order` from EndgameCategory/EndgameChapter

2. **Required Properties**: Added `targetMoves` to all test positions

3. **Type Corrections**: 
   - Changed goal values from 'loss' to 'defend'
   - Added proper type casting for difficulty levels

4. **Improved Null Safety**:
   ```typescript
   // Instead of using non-null assertions
   expect(position!.hints![0]).toHaveLength(5000);
   
   // Use explicit checks
   if (!position) {
     throw new Error('Test setup error: position should exist');
   }
   if (position.hints && position.hints.length > 0) {
     expect(position.hints[0]).toHaveLength(5000);
   }
   ```

## Conclusion

The Firebase Test Infrastructure provides a robust foundation for testing Firebase-integrated features with proper isolation, performance validation, and comprehensive coverage. It follows enterprise-level testing practices while maintaining ease of use for developers.