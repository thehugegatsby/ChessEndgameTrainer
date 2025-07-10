# Legacy Tests to Reimplement

This document tracks the critical E2E test scenarios that were removed from the legacy test suite and need to be reimplemented using the modern test infrastructure.

## Deleted Legacy Tests

The following tests were removed from `tests/e2e/legacy/`:

### Critical User Journeys
1. **engine-integration.spec.ts**
   - Engine toggle functionality
   - Engine evaluation display
   - Engine response to moves
   - Evaluation updates after moves
   - Engine error handling

2. **move-navigation.spec.ts**
   - Move history navigation
   - Board state synchronization
   - Navigation controls functionality

3. **pawn-endgame-win.spec.ts**
   - Pawn endgame scenarios
   - Win condition detection
   - Endgame evaluation

### Smoke Tests
4. **smoke-com.spec.ts**
   - Basic application functionality
   - Component initialization
   - Core user interactions

## Reimplementation Priority

### High Priority (Core Functionality)
- [ ] Engine integration and evaluation display
- [ ] Basic move making and validation
- [ ] Board state management

### Medium Priority (User Experience)
- [ ] Move navigation and history
- [ ] Error handling and recovery
- [ ] Performance under load

### Low Priority (Edge Cases)
- [ ] Specific endgame scenarios
- [ ] Advanced engine features
- [ ] Complex UI interactions

## Modern Test Infrastructure

All new tests should use:
- `ModernDriver` for high-level interactions
- Component-based testing with `BoardComponent`, `MoveListComponent`, etc.
- Test Bridge for deterministic testing
- Proper TypeScript typing throughout

## Notes

- Legacy tests used outdated patterns and incorrect imports
- New tests should follow the patterns established in `modern-driver-smoke.spec.ts`
- Focus on user-centric scenarios rather than implementation details
- Ensure all tests are maintainable and follow clean code principles