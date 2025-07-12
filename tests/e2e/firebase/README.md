# Firebase Test Infrastructure

This directory contains comprehensive Firebase testing utilities for the EndgameTrainer project, following enterprise architecture patterns.

## 🏗️ Architecture Overview

The Firebase test infrastructure provides a complete testing environment with:

- **Emulator Lifecycle Management**: Automatic startup/shutdown via Playwright global setup
- **Test Fixtures**: Extended Playwright fixtures with Firebase auth and data helpers
- **Service Layer**: Clean separation of business logic from HTTP concerns
- **Type Safety**: Full TypeScript support with discriminated unions
- **Enterprise Patterns**: Batch operations, error handling, validation, cleanup

## 📁 Directory Structure

```
firebase/
├── README.md                    # This documentation
├── firebase.constants.ts        # Configuration constants
├── firebase.utils.ts           # Pure utility functions
├── fixtures/
│   ├── users.ts                # Test user templates
│   └── scenarios.ts            # Test scenario definitions
└── auth.spec.ts               # Example Firebase tests
```

## 🚀 Quick Start

### Using the Firebase Test Fixture

```typescript
import { test, expect } from '../firebase-test-fixture';

test('Firebase integration test', async ({ 
  firebaseAuth, 
  firebaseData, 
  apiClient 
}) => {
  // Create authenticated user
  const { user, token } = await firebaseAuth.createUser({
    template: 'BEGINNER',
    autoLogin: true
  });

  // Seed test data
  await firebaseData.seedScenario('basic');

  // Test your application
  // ... your test logic here

  // Cleanup is automatic
});
```

### Manual Testing with API Client

```typescript
import { TestApiClient } from '../../api/TestApiClient';

const client = new TestApiClient(request);

// Create user
await client.createFirebaseUser({
  template: 'ADVANCED',
  overrides: { email: 'test@example.com' }
});

// Standard scenario seeding
await client.seedFirebaseScenario('advanced', {
  userCount: 5,
  includeProgress: true
});

// Advanced batch seeding with progress tracking
await client.seedFirebaseBatchAdvanced({
  positions: [/* position data */],
  categories: [/* category data */],
  chapters: [/* chapter data */],
  users: [/* user configurations */],
  options: {
    validateData: true,
    clearExisting: true,
    enableRetries: true,
    parallelism: 5,
    onProgress: (progress) => {
      console.log(`Progress: ${progress.percentage}% (${progress.currentOperation})`);
    }
  }
});

// Advanced scenario seeding with enhanced options
await client.seedFirebaseScenarioAdvanced('advanced', {
  userCount: 10,
  includeProgress: true,
  validateData: true,
  clearExisting: true,
  enableRetries: true,
  parallelism: 5,
  transactional: false,
  userOptions: {
    templates: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    customClaims: { scenario: 'advanced' }
  }
});

// Get seeding statistics and performance metrics
const stats = await client.getFirebaseSeedingStatistics();
console.log(`Total documents: ${stats.statistics.totalDocuments}`);
console.log(`Average speed: ${stats.statistics.performance.averageDocumentsPerSecond} docs/sec`);
```

## Test Patterns

### Setup Pattern
```typescript
test.beforeEach(async ({ testApi, page }) => {
  // Clean Firebase state
  await testApi.clearFirestore();
  
  // Seed test data
  await testApi.seedScenario('basic');
  
  // Navigate to app
  await page.goto('/');
});
```

### Authentication Pattern
```typescript
test('should work with authenticated user', async ({ authenticatedPage }) => {
  const { page, user } = authenticatedPage;
  // Test implementation with authenticated context
});
```

### Data Verification Pattern
```typescript
test('should persist data correctly', async ({ testApi, page }) => {
  // Arrange: Set up data via Test API
  await testApi.seedPositions([testPosition]);
  
  // Act: Perform UI actions
  await trainingPage.selectPosition(testPosition.id);
  
  // Assert: Verify UI state
  expect(await trainingPage.getCurrentPosition()).toBe(testPosition.fen);
  
  // Verify: Check data persistence via Test API
  const savedData = await testApi.getGameState(testPosition.id);
  expect(savedData.fen).toBe(testPosition.fen);
});
```

## Best Practices

### Test Isolation
- Each test starts with a clean Firebase state
- Use unique test data IDs to avoid conflicts
- Clean up after tests (handled automatically by fixtures)

### Performance
- Use batch operations for seeding multiple records
- Leverage Test API for setup instead of UI interactions
- Run tests in parallel where possible

### Debugging
- Use FirestoreDebugPage for inspecting data state
- Test API provides endpoints for data verification
- Emulator UI available at http://localhost:4000 during test runs

## Configuration

Firebase Emulator is automatically started by global-setup.ts:
- Firestore: localhost:8080
- Auth: localhost:9099
- Emulator UI: localhost:4000

Test data is isolated per test run and automatically cleaned up.

## Firebase-Specific Page Objects

### FirestoreDebugPage

The `FirestoreDebugPage` is a comprehensive page object for debugging Firebase state during tests:

```typescript
import { FirestoreDebugPage } from '../../pages/FirestoreDebugPage';

test('Firebase debugging example', async ({ page, apiClient }) => {
  const debugPage = new FirestoreDebugPage(page, apiClient);
  await debugPage.navigate();

  // Check connection status
  const connectionInfo = await debugPage.getConnectionInfo();
  expect(connectionInfo.status).toBe('connected');
  expect(connectionInfo.emulatorMode).toBe(true);

  // Get data statistics
  const stats = await debugPage.getDataStats();
  console.log(`Total documents: ${stats.totalDocuments}`);

  // Seed test data through UI
  await debugPage.seedTestData('basic');

  // Validate data integrity
  const validation = await debugPage.validateData();
  expect(validation.isValid).toBe(true);

  // Clear data with confirmation
  await debugPage.clearAllData({ confirm: true });

  // Verify with Test API
  await debugPage.verifyWithTestApi();
});
```

**Key Features:**
- Real-time Firebase connection monitoring
- Data statistics and collection counts
- UI-driven data seeding and clearing
- Data validation and integrity checks
- Progress tracking for batch operations
- Cross-verification with Test API
- Error handling and status reporting
- Export capabilities for debugging

## Related Files

- `tests/utils/firebase-test-helpers.ts` - Firebase emulator utilities
- `tests/api/TestApiClient.ts` - Test API client with Firebase methods
- `tests/fixtures/firebase-fixtures.ts` - Firebase-specific Playwright fixtures
- `tests/pages/FirestoreDebugPage.ts` - Enhanced Firebase debugging page object
- `tests/e2e/firebase/firestore-debug.spec.ts` - Comprehensive debug page tests