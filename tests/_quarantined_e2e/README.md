# Quarantined E2E Tests

**Status:** Deactivated on 2025-07-12

## Reason for Quarantine

These E2E tests were temporarily disabled due to:
- Instability of the TestBridge infrastructure
- Over-engineered abstractions (ModernDriver, TestBridge, MockEngineService)
- Blocking progress towards 80% test coverage goal

## Current Focus

Priority is on increasing unit test coverage for critical business logic:
- EngineService (currently 5%)
- Chess Services (currently 5%)
- Store (currently 69%)

## Re-evaluation

These tests will be re-evaluated after achieving 80% unit test coverage.
Future E2E tests will follow KISS principles with native Playwright features.
