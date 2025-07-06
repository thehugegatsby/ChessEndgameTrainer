# Test Structure

## Fresh Start - July 2025

This test suite has been reset to start fresh with a clean, maintainable structure.

### Directory Structure
```
tests/
├── unit/          # Unit tests for individual components/functions
├── integration/   # Integration tests for component interactions
└── e2e/          # End-to-end tests for full user workflows
```

### Previous Tests
- Backed up in: `backup/tests-20250706-185903/`
- Can be referenced if needed, but starting completely fresh

### Next Steps
1. Identify core functionality to test
2. Start with unit tests for critical business logic
3. Build up integration tests for key workflows
4. Add e2e tests for user journeys