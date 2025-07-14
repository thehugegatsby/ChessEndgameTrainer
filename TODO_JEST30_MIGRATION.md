# TODO: Jest 30 Migration - Modern Test Architecture

## 🎯 Ziele
- **Hauptziel**: 951 Unit Tests von globalen Mocks zu Dependency Injection Pattern migrieren
- **Kompatibilität**: Jest 30 mit jsdom v26 Kompatibilität herstellen
- **Architektur**: Moderne, wartbare Test-Architektur für Platform Services etablieren
- **Qualität**: Keine Test-Regression, CI bleibt grün

## 📋 Aktuelle Situation
- **Projekt**: ChessEndgameTrainer (React 18.3 + Next.js 15.3.3 + TypeScript)
- **Problem**: Jest 30 JSDOM v21→v26 Upgrade bricht globale Mocks (window.location, localStorage)
- **Bestand**: 7 Platform Services (WebStorage, WebDevice, WebNotification, WebClipboard, WebShare, WebPerformance, WebAnalytics)
- **Tests**: 951 Unit Tests mit globalen Mock-Patterns
- **Services**: Gemischte Patterns (Context, Singleton Factory, Store DI, Hook-based)

## 🔍 Gründe für Migration
- **Breaking Change**: `window.location` ist "non-configurable" in jsdom v26
- **Wartbarkeit**: Globale Mocks sind schwer zu debuggen und isolieren
- **Skalierbarkeit**: DI-Pattern ermöglicht bessere Test-Isolation
- **Modernität**: Beste Practices für TypeScript/React Testing

---

## Phase 1: Foundation & Architecture Design ⚡ CRITICAL PATH

### 1.1 Service Container Design & Implementation
- [ ] **Analysiere bestehende Service-Interfaces** (`IPlatformService`, `IPositionService`)
  - [ ] Lese `/shared/services/platform/types.ts`
  - [ ] Verstehe bestehende Interface-Strukturen
  - [ ] Dokumentiere Service-Dependencies
- [ ] **Implementiere leichtgewichtigen ServiceContainer**
  - [ ] Erstelle `/shared/services/container/ServiceContainer.ts`
  - [ ] Interface: `register<T>(key: ServiceKey<T>, factory: ServiceFactory<T>)`
  - [ ] Interface: `resolve<T>(key: ServiceKey<T>): T`
  - [ ] Singleton-Verhalten pro Container-Instanz
- [ ] **Definiere Service-Keys & Types**
  - [ ] Type-safe Service-Identifier
  - [ ] Service-Factory Interfaces
  - [ ] Container-Registry Types

### 1.2 Integration mit bestehender Architektur
- [ ] **Analysiere PositionServiceContext Pattern**
  - [ ] Verstehe `/shared/contexts/PositionServiceContext.tsx`
  - [ ] Identifiziere wiederverwendbare Patterns
- [ ] **Analysiere Zustand Store Integration**
  - [ ] Verstehe `/shared/store/storeConfig.ts`
  - [ ] Plane `configureStore()` Integration
- [ ] **Erstelle Adapter für bestehende Patterns**
  - [ ] Context-Provider Adapter
  - [ ] Factory-Pattern Adapter
  - [ ] Hook-Integration Adapter

---

## Phase 2: Test Utilities & Mock Infrastructure

### 2.1 Test Container Infrastructure
- [ ] **Erstelle Test-Utilities**
  - [ ] Datei: `/tests/utils/createTestContainer.ts`
  - [ ] Function: `createTestContainer(overrides?: ServiceOverrides)`
  - [ ] Standard Mock-Registrierungen
  - [ ] Override-Mechanismus für spezifische Tests
- [ ] **Mock Factory Development**
  - [ ] `createMockWebStorageService()`: localStorage/sessionStorage
  - [ ] `createMockWebDeviceService()`: navigator.*, device info
  - [ ] `createMockWebNotificationService()`: Notification API
  - [ ] `createMockWebClipboardService()`: navigator.clipboard
  - [ ] `createMockWebShareService()`: navigator.share
  - [ ] `createMockWebPerformanceService()`: performance.*
  - [ ] `createMockWebAnalyticsService()`: analytics tracking

### 2.2 Test Helper Functions
- [ ] **Service-spezifische Test-Helpers**
  - [ ] Storage assertions & matchers
  - [ ] Device API mock verifications
  - [ ] Notification permission mocking
- [ ] **Container Lifecycle Helpers**
  - [ ] `beforeEach` setup patterns
  - [ ] Container cleanup utilities
  - [ ] Service state reset functions

---

## Phase 3: Pilot Migration - WebStorageService

### 3.1 Service Refactoring
- [ ] **Analysiere WebStorageService Dependencies**
  - [ ] Current localStorage usage patterns
  - [ ] Window object dependencies
  - [ ] Error handling mechanisms
- [ ] **Refaktoriere WebStorageService**
  - [ ] Constructor injection für window/Storage
  - [ ] Interface consistency check
  - [ ] Backward compatibility preservation
- [ ] **Update Service Factory**
  - [ ] Integrate mit ServiceContainer
  - [ ] Preserve singleton behavior in app
  - [ ] Update `getPlatformService()` method

### 3.2 Pilot Test Migration
- [ ] **Identifiziere WebStorage Test-Files**
  - [ ] Find tests using localStorage directly
  - [ ] Find tests using WebPlatformService.storage
  - [ ] List useLocalStorage hook tests
- [ ] **Migriere erste Test-Suite** (ca. 10-15 Tests)
  - [ ] Replace global localStorage mocks
  - [ ] Use createTestContainer pattern
  - [ ] Verify test isolation
  - [ ] Document patterns & learnings
- [ ] **Validiere Pilot Success**
  - [ ] All tests pass
  - [ ] No test isolation issues
  - [ ] Performance impact acceptable
  - [ ] Pattern feels sustainable

---

## Phase 4: Scaled Migration - All Services

### 4.1 Service-by-Service Migration
- [ ] **WebDeviceService Migration**
  - [ ] Navigator API dependencies
  - [ ] Device memory, network status
  - [ ] UserAgent parsing logic
- [ ] **WebNotificationService Migration**
  - [ ] Notification API permissions
  - [ ] Browser support detection
  - [ ] Notification scheduling
- [ ] **WebClipboardService Migration**
  - [ ] navigator.clipboard mocking
  - [ ] Legacy fallback patterns
  - [ ] Async clipboard operations
- [ ] **WebShareService Migration**
  - [ ] navigator.share API
  - [ ] Feature detection patterns
  - [ ] Share capability checking
- [ ] **WebPerformanceService Migration**
  - [ ] performance.now() mocking
  - [ ] Performance measurement state
  - [ ] Memory usage tracking
- [ ] **WebAnalyticsService Migration**
  - [ ] Analytics event tracking
  - [ ] User identification
  - [ ] Page view tracking

### 4.2 Batch Test Migration
- [ ] **Create Migration Batches** (estimated per service)
  - [ ] WebDeviceService: ~50-80 tests
  - [ ] WebNotificationService: ~30-50 tests  
  - [ ] WebClipboardService: ~40-60 tests
  - [ ] WebShareService: ~20-30 tests
  - [ ] WebPerformanceService: ~60-90 tests
  - [ ] WebAnalyticsService: ~40-70 tests
- [ ] **Parallel Migration Strategy**
  - [ ] Service-basierte Aufteilung
  - [ ] Isolierte Test-Suites
  - [ ] Incremental CI integration

---

## Phase 5: Integration & Cleanup

### 5.1 Component Integration
- [ ] **Update Component Service Access**
  - [ ] Replace `getPlatformService()` calls
  - [ ] Update Context providers
  - [ ] Modify hook implementations
- [ ] **Zustand Store Integration**
  - [ ] Update store service injection
  - [ ] Preserve action interfaces
  - [ ] Test store-service integration

### 5.2 Legacy Cleanup
- [ ] **Remove Global Mock Patterns**
  - [ ] Delete jest setup files with global mocks
  - [ ] Remove beforeAll/afterAll global setups
  - [ ] Clean up manual property restoration
- [ ] **Update Jest Configuration**
  - [ ] Remove legacy jsdom workarounds
  - [ ] Update test environment settings
  - [ ] Optimize Jest 30 features

---

## Phase 6: Documentation & Validation

### 6.1 Documentation Creation
- [ ] **Migration Cookbook**
  - [ ] Before/After examples
  - [ ] Common patterns & recipes
  - [ ] Troubleshooting guide
- [ ] **Architecture Documentation**
  - [ ] Service Container design
  - [ ] DI patterns & best practices
  - [ ] Test utilities usage guide
- [ ] **Update Project Documentation**
  - [ ] CLAUDE.md updates
  - [ ] README.md test instructions
  - [ ] docs/TESTING.md modernization

### 6.2 Final Validation
- [ ] **Full Test Suite Validation**
  - [ ] All 951 tests pass
  - [ ] No test isolation issues
  - [ ] Performance benchmarks met
- [ ] **CI/CD Pipeline Testing**
  - [ ] Jest 30 compatibility confirmed
  - [ ] Build performance acceptable
  - [ ] No breaking changes in deployment
- [ ] **Issue #34 Completion**
  - [ ] Update GitHub issue with results
  - [ ] Document lessons learned
  - [ ] Archive migration artifacts

---

## 📊 Progress Tracking

**Phase 1**: ⏳ Foundation & Architecture Design  
**Phase 2**: ⏸️ Test Utilities & Mock Infrastructure  
**Phase 3**: ⏸️ Pilot Migration - WebStorageService  
**Phase 4**: ⏸️ Scaled Migration - All Services  
**Phase 5**: ⏸️ Integration & Cleanup  
**Phase 6**: ⏸️ Documentation & Validation  

**Overall Progress**: 0/951 tests migrated

---

## 🔗 Key Files & References

**Architecture Files:**
- `/shared/services/platform/types.ts` - Service interfaces
- `/shared/services/platform/PlatformService.ts` - Current factory
- `/shared/contexts/PositionServiceContext.tsx` - Context pattern reference
- `/shared/store/storeConfig.ts` - Store integration

**Test Files:**
- `/shared/services/platform/web/WebPlatformService.test.ts` - Current test patterns
- `/shared/hooks/useLocalStorage.test.ts` - Hook testing patterns

**Migration Targets:**
- Search for: `global.localStorage`, `global.navigator`, `beforeAll`, `afterAll`
- Focus areas: `/tests/`, `/shared/services/`, `/shared/hooks/`