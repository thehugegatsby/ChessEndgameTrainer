# Integration Testing Strategy

## Overview

Our integration testing strategy uses a multi-layered approach to ensure reliable and fast tests while maintaining confidence in external API integrations.

## Test Types

### 1. Unit Tests (.test.ts)

- **Environment**: Standard jsdom
- **Command**: `npm test` or `npm run test:unit`
- **Purpose**: Test individual components, hooks, and services in isolation
- **Coverage**: 575+ tests

### 2. Integration Tests (.spec.ts)

- **Environment**: jest-fixed-jsdom (for MSW v2 compatibility)
- **Command**: `npm run test:integration`
- **Purpose**: Test complete user flows with mocked external APIs
- **Key Features**:
  - Uses MSW (Mock Service Worker) v2 for API mocking
  - Tests the WDL perspective normalization bug fix
  - Validates move validation flows
  - Runs in CI/CD pipeline

### 3. Real API Tests (tablebase-real-api.integration.spec.ts)

- **Environment**: jest-fixed-jsdom with real network calls
- **Command**: `npm run test:real-api`
- **Purpose**: Validate API contract compatibility
- **Note**: Skipped in CI to avoid rate limiting
- **Coverage**:
  - API response format verification
  - Rate limiting handling
  - Cache behavior
  - Error scenarios

### 4. E2E Tests (Playwright)

- **Command**: `npm run test:e2e`
- **Purpose**: Full browser automation tests
- **Optional**: Critical move validation scenarios

## Test Separation Strategy

Following Gemini's recommendation, we separate tests by file extension:

```
*.test.ts   → Unit tests (jsdom environment)
*.spec.ts   → Integration tests (jest-fixed-jsdom environment)
```

This prevents environment conflicts between standard jsdom and MSW's requirements.

## MSW v2 Setup

We use MSW v2 with jest-fixed-jsdom for integration testing:

1. **jest-fixed-jsdom**: Provides both DOM APIs and Node.js native fetch
2. **MSW handlers**: Mock Lichess Tablebase API responses
3. **Known positions**: Pre-defined test scenarios for regression testing

## CI/CD Integration

The GitHub Actions workflow includes:

1. **Lint & Type Check**: Code quality gates
2. **Unit Tests**: Standard test suite with coverage
3. **Integration Tests**: MSW-based tests (real API tests skipped)
4. **Build**: Next.js production build
5. **E2E Tests**: Playwright browser tests

## Running Tests Locally

```bash
# All tests (unit + integration)
npm run test:all

# Unit tests only
npm test

# Integration tests only
npm run test:integration

# Real API tests (requires internet)
npm run test:real-api

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

## Key Test Scenarios

### WDL Perspective Bug (Regression Test)

Tests that suboptimal but winning moves (like Kd6 in K+P vs K) don't trigger error dialogs.

### Move Validation

Ensures the complete flow from user move → API call → WDL normalization → UI update works correctly.

### Error Handling

Tests graceful degradation when API fails or returns errors.

## Best Practices

1. **Mock by Default**: Use MSW for predictable, fast tests
2. **Real API Sparingly**: Only for contract validation
3. **Fail Open**: Allow moves even if API fails
4. **Cache Testing**: Verify cache behavior in tests
5. **Perspective Normalization**: Always test from the training side's perspective
