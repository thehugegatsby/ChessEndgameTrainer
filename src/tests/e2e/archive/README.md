# Archived E2E Tests

This directory contains old E2E tests that were archived during the test suite restructuring on 2025-08-18.

## Why archived?
- Tests used outdated selectors
- Mixed helper implementations (TrainingWorkflowHelper vs TrainingBoardPage)
- Inconsistent patterns
- Many tests were skipped (.skip.ts)

## Archived test categories:

### Pawn Promotion Tests
- `pawn-promotion-simple.skip.ts` - Basic promotion test
- `pawn-promotion.skip.ts` - Complex promotion scenarios
- `pawn-promotion-debug.skip.ts` - Debug version
- `pawn-promotion-sequencerunner.skip.ts` - Using sequence runner
- `pawn-promotion-simple-sequencerunner.skip.ts` - Simple sequence version

### Core Training Tests
- `core-training.skip.ts` - Basic training flow tests

### Error Recovery
- `error-recovery.skip.ts` - Error handling tests
- `phase3-error-scenarios.skip.ts` - Complex error scenarios

### State Management
- `state-persistence.skip.ts` - State persistence tests
- `store-debug.skip.ts` - Store debugging tests

### Feature Tests
- `weiterspielen-feature.skip.ts` - Continue playing feature
- `weiterspielen-bug-proof.skip.ts` - Bug-proof continue playing
- `phase2-demo.skip.ts` - Demo phase tests

### Scenarios
- `genericScenarioTest.skip.ts` - Generic scenario testing
- `streak-counter.skip.ts` - Streak counter tests

## New test structure
See the parent directory for the new clean test structure:
- `/core` - Smoke tests
- `/features` - Feature-specific tests  
- `/journeys` - User story tests
- `/page-objects` - Page Object Model

## Note
These tests contain valuable business logic and test scenarios. Refer to them when implementing new tests to understand what was previously tested.