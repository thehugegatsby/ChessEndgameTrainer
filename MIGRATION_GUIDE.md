# Jest 30 Migration Guide - From Global Mocks to ServiceContainer

## 🎯 Migration Overview

This guide shows how to migrate from Jest 29 global mocks to Jest 30 compatible ServiceContainer patterns.

**Problem**: Jest 30 with jsdom v26 makes `window.localStorage` non-configurable, breaking global mock patterns.  
**Solution**: Dependency injection with ServiceContainer abstracts browser APIs behind mockable interfaces.

---

## 📋 Quick Migration Checklist

- [ ] Replace `beforeAll`/`afterAll` global mock setup with `createTestContainer()`
- [ ] Use `container.resolve('platform.storage')` instead of direct service imports
- [ ] Replace manual cleanup with automatic container lifecycle
- [ ] Update React components to use `ServiceProvider` wrapper
- [ ] Verify all tests pass with new pattern

---

## 🔄 Before vs After Patterns

### ❌ OLD PATTERN (Jest 30 Incompatible)

```typescript
// OLD - Global localStorage mocking (BREAKS in Jest 30)
describe('WebStorageService', () => {
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    // ...
  };

  beforeAll(() => {
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterAll(() => {
    // Manual cleanup required
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  });

  test('should save data', async () => {
    const service = new WebStorageService(); // Direct instantiation
    await service.save('key', 'value');
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });
});
```

**Problems:**
- ❌ Global state pollution between tests
- ❌ Jest 30 incompatible (`window.localStorage` non-configurable)
- ❌ Manual cleanup prone to errors
- ❌ Hard to isolate test scenarios

### ✅ NEW PATTERN (Jest 30 Compatible)

```typescript
// NEW - ServiceContainer with dependency injection
import { createTestContainer } from '@tests/utils';

describe('WebStorageService', () => {
  let container: ReturnType<typeof createTestContainer>;
  let storageService: IPlatformStorage;
  let mockStorage: Storage;

  beforeEach(() => {
    // Fresh container per test - perfect isolation!
    container = createTestContainer();
    storageService = container.resolve('platform.storage');
    mockStorage = container.resolveCustom<Storage>('browser.localStorage');
  });

  test('should save data', async () => {
    await storageService.save('key', 'value');
    expect(mockStorage.setItem).toHaveBeenCalledWith('chess_trainer_key', '"value"');
  });
});
```

**Benefits:**
- ✅ Jest 30 compatible
- ✅ Perfect test isolation
- ✅ Automatic cleanup
- ✅ Type-safe service resolution
- ✅ No global state pollution

---

## 🛠️ Step-by-Step Migration Process

### Step 1: Import Test Utilities

```typescript
// Add to your test file
import { 
  createTestContainer, 
  TestScenarios, 
  TestAssertions 
} from '@tests/utils';
```

### Step 2: Replace Global Setup

```typescript
// REMOVE this:
beforeAll(() => {
  Object.defineProperty(global, 'localStorage', { /* ... */ });
});

// REPLACE with this:
let container: ReturnType<typeof createTestContainer>;

beforeEach(() => {
  container = createTestContainer();
});
```

### Step 3: Update Service Access

```typescript
// REMOVE this:
import { WebPlatformService } from '@shared/services/platform/web/WebPlatformService';
const service = new WebPlatformService();

// REPLACE with this:
const storageService = container.resolve('platform.storage');
const mockStorage = container.resolveCustom<Storage>('browser.localStorage');
```

### Step 4: Update Assertions

```typescript
// REMOVE this:
expect(global.localStorage.setItem).toHaveBeenCalled();

// REPLACE with this:
TestAssertions.expectStorageCall(mockStorage, 'setItem', 'key', 'value');
// OR
expect(mockStorage.setItem).toHaveBeenCalledWith('key', 'value');
```

### Step 5: Handle React Components

```typescript
// REMOVE this:
render(<MyComponent />);

// REPLACE with this:
const container = createTestContainer();
const TestWrapper = ({ children }) => {
  const { ServiceProvider } = require('@shared/services/container/adapter');
  return <ServiceProvider container={container}>{children}</ServiceProvider>;
};

render(<MyComponent />, { wrapper: TestWrapper });
```

---

## 🎭 Test Scenarios & Patterns

### Pattern 1: Basic Test Migration

```typescript
describe('Basic migration pattern', () => {
  let container: ReturnType<typeof createTestContainer>;
  let storageService: IPlatformStorage;

  beforeEach(() => {
    container = createTestContainer();
    storageService = container.resolve('platform.storage');
  });

  test('saves and loads data', async () => {
    await storageService.save('user', { name: 'John' });
    const result = await storageService.load('user');
    expect(result).toEqual({ name: 'John' });
  });
});
```

### Pattern 2: Pre-configured Scenarios

```typescript
describe('Scenario-based testing', () => {
  test('offline scenario', async () => {
    const container = TestScenarios.offline();
    const deviceService = container.resolve('platform.device');
    
    expect(deviceService.getNetworkStatus().isOnline).toBe(false);
  });

  test('with existing data', async () => {
    const container = TestScenarios.withStorageData({
      'chess_trainer_user': '{"name":"Jane"}'
    });
    
    const storageService = container.resolve('platform.storage');
    const user = await storageService.load('user');
    expect(user).toEqual({ name: 'Jane' });
  });
});
```

### Pattern 3: Custom Mocks

```typescript
describe('Custom mock scenarios', () => {
  test('localStorage quota exceeded', async () => {
    const failingStorage = {
      setItem: jest.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      }),
      // ... other methods
    } as Storage;

    const container = createTestContainer({ localStorage: failingStorage });
    const storageService = container.resolve('platform.storage');

    await expect(storageService.save('key', 'data'))
      .rejects.toThrow('Failed to save data');
  });
});
```

### Pattern 4: React Component Integration

```typescript
describe('React component integration', () => {
  test('component uses storage service', () => {
    const container = createTestContainer();
    
    const TestWrapper = ({ children }) => {
      const { ServiceProvider } = require('@shared/services/container/adapter');
      return <ServiceProvider container={container}>{children}</ServiceProvider>;
    };

    render(<UserProfile />, { wrapper: TestWrapper });
    
    // Component can now use usePlatformStorage() hook
    // and it will get the mocked storage from the container
  });
});
```

---

## 🔧 Migration Utilities

### Available Test Utilities

```typescript
// Test Container Creation
createTestContainer(overrides?: TestServiceOverrides): IServiceContainer
setupTestContainer(overrides?): () => IServiceContainer

// Pre-configured Scenarios  
TestScenarios.default(): IServiceContainer
TestScenarios.withStorageData(data): IServiceContainer
TestScenarios.offline(): IServiceContainer
TestScenarios.mobile(): IServiceContainer
TestScenarios.lowMemory(): IServiceContainer

// Test Assertions
TestAssertions.expectStorageCall(storage, method, ...args)
TestAssertions.expectStorageState(storage, expectedData)
TestAssertions.expectStorageEmpty(storage)

// Mock Factories
createMockPlatformStorage(): jest.Mocked<IPlatformStorage>
createMockPlatformDevice(): jest.Mocked<IPlatformDevice>
// ... etc for all services

// Jest Setup Helpers
setupPerTestContainer(overrides?): () => IServiceContainer
setupReactTestingWithContainer(overrides?)
```

---

## 🎯 Service-Specific Migration Examples

### WebStorageService

```typescript
// OLD
const mockLocalStorage = { /* ... */ };
beforeAll(() => { /* global setup */ });

// NEW
const container = createTestContainer();
const storage = container.resolve('platform.storage');
const mockStorage = container.resolveCustom<Storage>('browser.localStorage');
```

### WebDeviceService

```typescript
// OLD
const mockNavigator = { /* ... */ };
beforeAll(() => { /* global setup */ });

// NEW
const container = createTestContainer({ 
  navigator: mockNavigator 
});
const device = container.resolve('platform.device');
```

### WebNotificationService

```typescript
// OLD
global.Notification = MockNotification;

// NEW
const mockWindow = { Notification: MockNotification };
const container = createTestContainer({ window: mockWindow });
const notifications = container.resolve('platform.notifications');
```

---

## ⚠️ Common Migration Pitfalls

### 1. Global State Leakage
```typescript
// ❌ DON'T: Reuse containers between tests
let container = createTestContainer(); // Outside beforeEach

// ✅ DO: Fresh container per test
beforeEach(() => {
  container = createTestContainer();
});
```

### 2. Direct Service Imports
```typescript
// ❌ DON'T: Import services directly
import { WebStorageService } from '@shared/services/platform/web/WebStorageService';
const service = new WebStorageService();

// ✅ DO: Resolve from container
const service = container.resolve('platform.storage');
```

### 3. Missing Mock Assertions
```typescript
// ❌ DON'T: Forget to test mocks
await storageService.save('key', 'value');
// No assertion on mock

// ✅ DO: Verify mock interactions
await storageService.save('key', 'value');
TestAssertions.expectStorageCall(mockStorage, 'setItem', 'chess_trainer_key', '"value"');
```

### 4. React Integration Issues
```typescript
// ❌ DON'T: Forget ServiceProvider wrapper
render(<ComponentThatUsesStorage />);

// ✅ DO: Wrap with ServiceProvider
const TestWrapper = ({ children }) => (
  <ServiceProvider container={container}>{children}</ServiceProvider>
);
render(<ComponentThatUsesStorage />, { wrapper: TestWrapper });
```

---

## 📊 Migration Progress Tracking

Use this checklist to track migration progress:

### Service Tests
- [ ] WebStorageService (Priority: HIGH - main Jest 30 issue)
- [ ] WebDeviceService
- [ ] WebNotificationService  
- [ ] WebClipboardService
- [ ] WebShareService
- [ ] WebPerformanceService
- [ ] WebAnalyticsService

### Integration Tests
- [ ] useLocalStorage hook tests
- [ ] Component tests using platform services
- [ ] Store integration tests
- [ ] E2E test compatibility

### Validation
- [ ] All tests pass with Jest 30
- [ ] No global mock usage remaining
- [ ] Test isolation verified
- [ ] Performance impact acceptable

---

## 🚀 Next Steps After Migration

1. **Validate**: Ensure all 951 tests pass with new patterns
2. **Optimize**: Profile test performance and optimize if needed
3. **Document**: Update team documentation with new patterns
4. **Train**: Share knowledge with team members
5. **Extend**: Use patterns for new service development

---

## 🆘 Need Help?

**Common Issues:**
- Tests fail with "Service not found" → Check service registration
- Mock not working → Verify container setup in beforeEach
- React component errors → Ensure ServiceProvider wrapper

**Debug Tools:**
```typescript
// Debug container state
console.log('Container stats:', container.getStats());
console.log('Registered keys:', container.getRegisteredKeys());

// Debug service resolution
const service = container.resolve('platform.storage');
console.log('Service type:', typeof service);
```

This migration guide ensures a smooth transition from Jest 29 global mocks to Jest 30 compatible ServiceContainer patterns! 🎉