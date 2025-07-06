# Chess Engine & Evaluation Core - Unit Test Suite

## 📋 Overview

This test suite covers the **Chess Engine & Evaluation Core** feature, which is the heart of the ChessEndgameTrainer application. The tests ensure robustness, mobile optimization, and correct evaluation logic for the core chess engine functionality.

## 🎯 Test Coverage Areas

### 1. ScenarioEngine.test.ts
**Primary Component**: `shared/lib/chess/ScenarioEngine/index.ts`

**Test Categories**:
- **Instance Management**: Memory management, instance counting, cleanup procedures
- **FEN Validation**: Position loading, validation, and error handling
- **Move Making**: Legal move validation, engine responses, promotion handling
- **Engine Integration**: Best move calculation, evaluation requests, multi-PV analysis
- **Tablebase Integration**: Endgame position analysis, tablebase queries
- **Error Handling**: Graceful failure handling, service unavailability
- **Mobile Optimization**: Memory limits, performance constraints

**Key Test Scenarios**:
- `should_track_instance_count_correctly_when_creating_multiple_engines`
- `should_make_legal_move_and_trigger_engine_response`
- `should_handle_engine_failure_gracefully`
- `should_limit_instance_creation_for_memory_management`

### 2. EvaluationService.test.ts
**Primary Component**: `shared/lib/chess/ScenarioEngine/evaluationService.ts`

**Test Categories**:
- **Critical Mistake Detection**: Score drop analysis, sign flip detection, mate transitions
- **Dual Evaluation System**: Engine + tablebase integration, perspective correction
- **Evaluation Formatting**: Centipawn display, mate announcements
- **Performance**: Concurrent requests, timeout handling
- **Perspective Correction**: White/Black player perspective handling

**Key Test Scenarios**:
- `should_identify_critical_mistake_when_score_drops_significantly`
- `should_apply_perspective_correction_for_black_moves`
- `should_get_dual_evaluation_with_engine_and_tablebase`
- `should_handle_concurrent_evaluation_requests`

### 3. TablebaseService.test.ts
**Primary Component**: `shared/lib/chess/ScenarioEngine/tablebaseService.ts`

**Test Categories**:
- **Position Detection**: Tablebase position identification (≤7 pieces)
- **Caching System**: LRU cache, memory management, performance optimization
- **Move Evaluation**: Best move formatting, category flipping
- **Error Handling**: Network failures, timeouts, malformed responses
- **Performance**: Bulk operations, memory efficiency

**Key Test Scenarios**:
- `should_cache_tablebase_results_for_mobile_performance`
- `should_limit_cache_size_for_memory_management`
- `should_flip_tablebase_categories_for_perspective_correction`
- `should_handle_concurrent_tablebase_requests`

## 🧪 Test Infrastructure

### Mock Strategy
- **MockEngine**: Controlled engine responses with configurable delays and failures
- **MockTablebaseService**: Deterministic tablebase results for consistent testing
- **Test Positions**: Curated collection of chess positions for comprehensive testing

### Test Data Sources
- `tests/helpers/testPositions.ts`: Standard chess positions and moves
- `tests/helpers/engineMocks.ts`: Mock implementations with realistic behavior

### Testing Patterns
- **Isolation**: Each test uses fresh mock instances
- **Deterministic**: Controlled responses prevent flaky tests
- **Mobile-First**: Tests verify memory management and performance constraints
- **Error Scenarios**: Comprehensive error handling verification

## 🎲 Test Data

### Standard Test Positions
```typescript
TEST_POSITIONS = {
  STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  KQK_TABLEBASE_WIN: '8/8/8/8/8/8/4K3/k6Q w - - 0 1',
  ROOK_ENDGAME: '8/8/1K6/8/8/8/2k5/4R3 w - - 0 1',
  // ... additional positions for comprehensive testing
}
```

### Expected Behaviors
- **Instance Tracking**: Mobile memory management through instance counting
- **Perspective Correction**: Engine evaluations adjusted for player perspective
- **Cache Management**: LRU eviction with mobile-optimized size limits
- **Error Recovery**: Graceful fallbacks when services are unavailable

## 🚀 Running the Tests

```bash
# Run all engine core tests
npm test tests/unit/engine/

# Run specific test file
npm test tests/unit/engine/ScenarioEngine.test.ts

# Run with coverage
npm test tests/unit/engine/ --coverage

# Run in watch mode during development
npm test tests/unit/engine/ --watch
```

## 📊 Coverage Goals

| Component | Target Coverage | Focus Areas |
|-----------|----------------|-------------|
| ScenarioEngine | 90%+ | Instance management, move making, integration |
| EvaluationService | 85%+ | Mistake detection, perspective correction |
| TablebaseService | 85%+ | Caching logic, position detection |

## 🔧 Mock Configuration

### Engine Mock Features
- Configurable evaluation responses
- Controllable delays and timeouts
- Failure simulation
- Call tracking for verification

### Tablebase Mock Features
- Position-based responses
- Network error simulation
- Timing control
- Cache behavior simulation

## 📝 Test Naming Convention

Format: `should_[expected_behavior]_when_[condition]`

Examples:
- `should_track_instance_count_correctly_when_creating_multiple_engines`
- `should_apply_perspective_correction_for_black_moves`
- `should_handle_tablebase_service_failure_gracefully`

## ⚠️ Known Test Limitations

1. **Real Engine Integration**: Tests use mocks; integration tests needed for real Stockfish
2. **Network Simulation**: Tablebase network behavior is simulated, not real API calls
3. **Mobile Performance**: Actual mobile device testing requires device-specific tests
4. **Race Conditions**: Some concurrent behavior may need additional stress testing

## 🔄 Maintenance

### Regular Updates Needed
- Update test positions when new endgames are added
- Adjust mock responses when engine behavior changes
- Update coverage goals as codebase evolves
- Review mobile performance limits based on testing data

### Adding New Tests
1. Follow the established naming convention
2. Use appropriate test helpers and mocks
3. Include comprehensive error scenarios
4. Document the purpose and expected behavior
5. Ensure mobile optimization considerations

## 🎯 Success Criteria

- [ ] All tests pass consistently (100% pass rate)
- [ ] Coverage targets met (85%+ for all components)
- [ ] Tests run in <5 seconds total
- [ ] No flaky or intermittent failures
- [ ] Mobile performance constraints verified
- [ ] Error handling comprehensively tested
- [ ] Mock behavior matches real service contracts