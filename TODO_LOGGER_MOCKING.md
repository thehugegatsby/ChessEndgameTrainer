# Logger Mocking Issue

## Problem

The TestApiService test is failing because of a circular dependency issue when mocking the logger. The logger is created at the module level in TestApiService.ts:

```typescript
const logger = getLogger().setContext("TestApiService");
```

## Current Situation

- Tests are failing with: "Cannot access 'mockLoggerInstance' before initialization"
- This is due to Jest hoisting and module initialization order

## Gemini's Recommendations

### Strategy 1: Shared Mock Instance (Attempted)

- Create a shared mock instance
- Use jest.resetModules() if needed
- **Issue**: Still getting circular dependency errors

### Strategy 2: Dependency Injection (Recommended Long-term)

- Refactor TestApiService to accept logger as a constructor parameter
- Makes the service more testable
- Requires refactoring TestApiService and all code that uses it

## Temporary Solution

For now, the tests are committed with failures noted. The logger mocking needs to be addressed in a separate PR.

## Next Steps

1. Consider refactoring TestApiService to use dependency injection
2. Or investigate alternative mocking strategies (manual mocks, etc.)
3. Could also consider making logger creation lazy (getter pattern)
