# Service Dependencies Analysis - Jest 30 Migration

## Overview
Detailed analysis of Platform Service dependencies to design DI Container architecture.

---

## Interface Structure Analysis

### Core Interface Hierarchy
```
IPlatformService (Main Container)
├── storage: IPlatformStorage
├── notifications: IPlatformNotification  
├── device: IPlatformDevice
├── performance: IPlatformPerformance
├── fileSystem?: IPlatformFileSystem (optional)
├── clipboard: IPlatformClipboard
├── share: IPlatformShare
└── analytics: IPlatformAnalytics
```

### Additional Interfaces
- **IPlatformDetection**: Platform detection utilities
- **Supporting Types**: NotificationOptions, DeviceInfo, MemoryInfo, etc.

---

## Browser API Dependencies by Service

### 🔵 WebStorage (IPlatformStorage)
**Browser APIs:**
- `window.localStorage` - Primary storage mechanism
- `JSON.stringify/parse` - Data serialization

**Current Global Dependencies:**
- Direct `localStorage` access in lines 41, 56, 75, 80
- No window injection, hardcoded global access

**Migration Priority:** ⚡ **HIGH** (localStorage is main Jest 30 issue)

---

### 🔵 WebNotification (IPlatformNotification)
**Browser APIs:**
- `window.Notification` - Notification constructor
- `Notification.requestPermission()` - Permission handling
- `'Notification' in window` - Feature detection

**Current Global Dependencies:**
- Direct `window.Notification` access (lines 98, 102, 107, 111)
- Global window feature detection

**Migration Priority:** 🟡 **MEDIUM**

---

### 🔵 WebDevice (IPlatformDevice)
**Browser APIs:**
- `navigator.userAgent` - Platform/device detection
- `window.screen` - Screen dimensions
- `window.devicePixelRatio` - Display metrics
- `navigator.deviceMemory` - Memory info
- `navigator.connection` - Network status
- `navigator.onLine` - Online status

**Current Global Dependencies:**
- Direct navigator access (lines 138, 149, 152, 161, 171)
- Direct window.screen access (lines 152-153)
- Complex navigator casting: `navigator as any` (lines 161, 171, 185)

**Migration Priority:** 🟡 **MEDIUM**

---

### 🔵 WebPerformance (IPlatformPerformance)
**Browser APIs:**
- `performance.now()` - Timing measurements

**Current Global Dependencies:**
- Direct `performance.now()` access (lines 208, 217, 229)
- Internal state management (measures, marks)

**Migration Priority:** 🟢 **LOW** (less complex dependencies)

---

### 🔵 WebClipboard (IPlatformClipboard)
**Browser APIs:**
- `navigator.clipboard` - Modern clipboard API
- `document.createElement/execCommand` - Legacy fallback

**Current Global Dependencies:**
- Direct `navigator.clipboard` access (lines 272, 288)
- Direct document manipulation (lines 276-283)

**Migration Priority:** 🟡 **MEDIUM**

---

### 🔵 WebShare (IPlatformShare)
**Browser APIs:**
- `navigator.share` - Web Share API
- `'share' in navigator` - Feature detection

**Current Global Dependencies:**
- Direct `navigator.share` access (lines 303, 312)
- Simple feature detection

**Migration Priority:** 🟢 **LOW** (simple implementation)

---

### 🔵 WebAnalytics (IPlatformAnalytics)
**Browser APIs:**
- None (stub implementation)

**Current Global Dependencies:**
- None (empty stub methods)

**Migration Priority:** 🟢 **VERY LOW**

---

## Current Singleton Pattern Analysis

### Factory Pattern (PlatformService.ts)
```typescript
// CURRENT PROBLEMATIC PATTERN
let platformServiceInstance: IPlatformService | null = null;

export function getPlatformService(): IPlatformService {
  if (!platformServiceInstance) {
    platformServiceInstance = new WebPlatformService(); // ❌ Hardcoded instantiation
  }
  return platformServiceInstance;
}
```

**Problems for Testing:**
- ❌ Global singleton state persists between tests
- ❌ No way to inject mock dependencies
- ❌ Constructor creates all services with hardcoded global access
- ❌ `resetPlatformService()` only resets instance, not dependencies

### WebPlatformService Constructor
```typescript
// CURRENT PROBLEMATIC PATTERN
constructor() {
  this.storage = new WebStorage();        // ❌ Direct instantiation
  this.notifications = new WebNotification(); // ❌ No dependency injection
  this.device = new WebDevice();          // ❌ Hardcoded global access
  // ... etc
}
```

**Problems:**
- ❌ No way to substitute individual services
- ❌ All global APIs accessed directly in service classes
- ❌ No constructor injection of dependencies

---

## Required DI Container Architecture

### Service Container Requirements
1. **Service Registration**: Register service factories with type-safe keys
2. **Service Resolution**: Resolve services with singleton behavior per container
3. **Dependency Injection**: Allow injection of browser APIs into services
4. **Test Substitution**: Enable easy mocking in test environment

### Browser API Abstraction Needs
```typescript
// REQUIRED ABSTRACTIONS
interface IBrowserAPIs {
  localStorage: Storage;
  sessionStorage: Storage;
  navigator: Navigator;
  window: Window;
  document: Document;
  performance: Performance;
}
```

### Refactored Service Constructors
```typescript
// TARGET PATTERN
class WebStorage implements IPlatformStorage {
  constructor(private apis: Pick<IBrowserAPIs, 'localStorage'>) {}
  
  async save(key: string, data: any): Promise<void> {
    // Use this.apis.localStorage instead of global localStorage
  }
}
```

---

## Migration Strategy by Priority

### Phase 1: High Priority (WebStorage)
- **Why First**: localStorage is main Jest 30 breaking change
- **Complexity**: Medium (JSON handling, error management)
- **Test Impact**: ~50-80 tests affected
- **Dependencies**: Only localStorage

### Phase 2: Medium Priority Services
1. **WebDevice** - Most complex navigator dependencies
2. **WebNotification** - Notification API abstraction
3. **WebClipboard** - Navigator + document dependencies

### Phase 3: Low Priority Services  
1. **WebPerformance** - Simple performance.now() dependency
2. **WebShare** - Simple navigator.share dependency
3. **WebAnalytics** - No dependencies (stub)

---

## Test Migration Patterns

### Current Problematic Test Pattern
```typescript
// CURRENT BAD PATTERN (Jest 30 incompatible)
beforeAll(() => {
  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });
});
```

### Target DI Container Test Pattern
```typescript
// TARGET PATTERN (Jest 30 compatible)
beforeEach(() => {
  const mockAPIs = { localStorage: createMockStorage() };
  container = createTestContainer({
    storage: new WebStorage(mockAPIs)
  });
});
```

---

## Key Files for Implementation

### New Files to Create
1. `/shared/services/container/ServiceContainer.ts` - Core DI container
2. `/shared/services/container/types.ts` - Container type definitions
3. `/shared/services/browser/BrowserAPIs.ts` - Browser API abstractions
4. `/tests/utils/createTestContainer.ts` - Test utilities
5. `/tests/utils/mockFactories.ts` - Mock service factories

### Files to Modify
1. `/shared/services/platform/web/WebPlatformService.ts` - Add DI support
2. `/shared/services/platform/PlatformService.ts` - Integrate container
3. All service classes: WebStorage, WebDevice, etc. - Add constructor injection
4. Test files: Update to use DI container pattern

---

## Success Criteria

### Technical Validation
- ✅ All 951 tests pass with new DI pattern
- ✅ No global mock usage in any test
- ✅ Jest 30 fully compatible
- ✅ Service isolation in tests confirmed

### Architectural Validation  
- ✅ Clean dependency injection throughout
- ✅ Type-safe service resolution
- ✅ Easy test utility usage
- ✅ Backward compatibility preserved for app code

### Performance Validation
- ✅ No CI performance regression
- ✅ Test execution time maintained
- ✅ Memory usage reasonable
- ✅ Bundle size impact minimal