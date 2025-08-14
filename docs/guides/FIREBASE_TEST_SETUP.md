# Firebase Test Setup Guide

## Overview
This guide explains how to run Firebase integration tests that require the Firebase Emulator Suite.

## Current Status
- **Tests Available**: ~25 comprehensive integration tests
- **Location**: `src/tests/integration/firebase/FirebaseService.test.ts`
- **Status**: Skipped by default (infrastructure-dependent)
- **Lines of Code**: 547 lines of comprehensive test coverage

## Prerequisites

### 1. Install Firebase Tools
```bash
npm install -g firebase-tools
```

### 2. Verify Configuration
The emulator configuration already exists in `config/firebase/firebase.json`:
- Auth emulator: Port 9099
- Firestore emulator: Port 8080
- UI: Port 4000

## Running Firebase Tests

### Option 1: Using NPM Scripts (Recommended)
```bash
# Start emulator and run tests
firebase emulators:exec "vitest run src/tests/integration/firebase/FirebaseService.test.ts"
```

### Option 2: Manual Setup
```bash
# Terminal 1: Start emulator
pnpm run firebase:emulator

# Terminal 2: Run tests with environment variables
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
GCLOUD_PROJECT=endgame-trainer-test \
vitest run src/tests/integration/firebase/FirebaseService.test.ts
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install Firebase Tools
  run: npm install -g firebase-tools

- name: Run Firebase Tests
  env:
    FIRESTORE_EMULATOR_HOST: 127.0.0.1:8080
    FIREBASE_AUTH_EMULATOR_HOST: 127.0.0.1:9099
    GCLOUD_PROJECT: endgame-trainer-test
  run: |
    firebase emulators:exec "pnpm test:firebase"
```

### Add to package.json
```json
{
  "scripts": {
    "test:firebase": "vitest run src/tests/integration/firebase/",
    "test:firebase:ci": "firebase emulators:exec \"pnpm test:firebase\""
  }
}
```

## Test Coverage

The Firebase tests cover:
- **CRUD Operations**: User progress documents, card progress
- **Real-time Updates**: onSnapshot listeners, concurrent updates
- **Authentication**: User creation, anonymous users, security rules
- **Batch Operations**: Multiple document writes
- **Error Handling**: Invalid paths, missing fields
- **Multi-device Sync**: Conflict resolution, last-write-wins

## Troubleshooting

### Emulator Won't Start
- Check if ports 8080, 9099, 4000 are available
- Run: `lsof -i :8080` to check port usage

### Tests Timeout
- Increase timeout in test: `vi.setConfig({ testTimeout: 60000 })`
- Ensure emulator is fully started before running tests

### Authentication Errors
- Verify environment variables are set correctly
- Check that `GCLOUD_PROJECT` matches your configuration

## Best Practices

1. **Use `emulators:exec`**: Ensures proper startup and cleanup
2. **Set Environment Variables**: Required for Admin SDK connection
3. **Clear Data Between Tests**: Use helper functions to reset state
4. **Increase Timeouts**: Emulator tests may need longer timeouts
5. **Cache in CI**: Cache `~/.cache/firebase/emulators/` directory

## Future Improvements

- [ ] Add unit tests that don't require emulator (mock firebase-admin)
- [ ] Create test data seeding scripts
- [ ] Add performance benchmarks
- [ ] Implement parallel test execution
- [ ] Add visual regression tests for Firebase UI components

## References

- [Firebase Emulator Suite Documentation](https://firebase.google.com/docs/emulator-suite)
- [Testing with Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Vitest Configuration](https://vitest.dev/config/)