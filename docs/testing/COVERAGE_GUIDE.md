# Coverage Measurement Guide

## Overview

This guide explains how to accurately measure test coverage for the EndgameTrainer project, focusing on business logic coverage vs. overall project coverage.

## The Problem

When running standard coverage (`npm run test:coverage`), Jest includes ALL files in the project:
- React components (UI)
- Next.js pages
- Mobile app files
- Static data files
- Type definitions

This results in artificially low coverage percentages (~39%) because UI components and pages often have minimal or no tests, which is acceptable for many projects.

## The Solution

We've created a specialized Jest configuration that measures coverage for **business logic only**, giving a more accurate picture of test coverage for the critical parts of the application.

### Business Logic Coverage Command

```bash
npm run test:coverage:business
```

This command uses a custom Jest configuration (`tests/jest.config.business.js`) that:

1. **Includes** only business logic modules:
   - `shared/lib/**` - Core libraries and utilities
   - `shared/services/**` - Service layer (API, engine, etc.)
   - `shared/hooks/**` - React hooks (business logic)
   - `shared/store/**` - State management
   - `shared/contexts/**` - React contexts
   - `shared/utils/**` - Utility functions

2. **Excludes** non-business logic:
   - `shared/components/**` - UI Components
   - `pages/**` - Next.js pages
   - `app/**` - Application shells
   - Type definitions (`*.d.ts`)
   - Test files
   - Static data files

3. **Outputs** to a separate directory:
   - Coverage reports go to `coverage-business/`
   - HTML report available at `coverage-business/index.html`

## Usage Examples

### Check Business Logic Coverage
```bash
# Run tests with business logic coverage
npm run test:coverage:business

# Open the HTML report
open coverage-business/index.html  # macOS
xdg-open coverage-business/index.html  # Linux
start coverage-business/index.html  # Windows
```

### Compare Different Coverage Metrics
```bash
# Overall project coverage (includes UI, pages, etc.)
npm run test:coverage
# Output: ~39% coverage

# Business logic only
npm run test:coverage:business
# Output: ~78-80% coverage (more accurate for logic)

# Evaluation module specific coverage
npm run test:coverage:evaluation
# Output: Coverage for just the evaluation pipeline
```

## Interpreting Results

### Business Logic Coverage Goals
- **Target**: 80% for production readiness
- **Current**: ~78-80% (as of 2025-01-17)
- **Focus Areas**: 
  - Services and utilities should have >90% coverage
  - Hooks and contexts should have >80% coverage
  - Core libraries should have >85% coverage

### What the Numbers Mean
- **Statements**: % of executable statements tested
- **Branches**: % of conditional branches tested
- **Functions**: % of functions called during tests
- **Lines**: % of source lines tested

### Coverage Thresholds
The business logic configuration enforces these thresholds:
```javascript
coverageThreshold: {
  global: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  }
}
```

## Configuration Details

### Jest Business Logic Config
Location: `tests/jest.config.business.js`

Key differences from standard config:
- Custom `collectCoverageFrom` patterns
- Separate `coverageDirectory`
- Higher coverage thresholds
- Focused on business logic paths

### Adding New Patterns
To include/exclude additional paths, modify the `collectCoverageFrom` array:

```javascript
collectCoverageFrom: [
  // Add new inclusion
  '<rootDir>/shared/newModule/**/*.{ts,tsx}',
  
  // Add new exclusion
  '!<rootDir>/shared/generated/**'
]
```

## Troubleshooting

### Issue: Coverage seems too low
1. Check if your business logic is in the included paths
2. Verify tests are actually running: `npm test`
3. Look for untested exports in index files

### Issue: Coverage includes unwanted files
1. Add exclusion patterns to `collectCoverageFrom`
2. Use `!` prefix for exclusions
3. Check for overly broad inclusion patterns

### Issue: Can't find coverage report
1. Look in `coverage-business/` directory (not `coverage/`)
2. Ensure tests completed successfully
3. Check for permissions issues

## Best Practices

1. **Use the right metric**: Business logic coverage for code quality, overall coverage for completeness
2. **Focus on critical paths**: Prioritize testing services, hooks, and core libraries
3. **Don't chase 100%**: Some code (error boundaries, platform-specific) may not need tests
4. **Regular checks**: Run coverage before commits and PRs
5. **Update this guide**: When patterns change, update this documentation

## Related Commands

```bash
# All test commands
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:watch         # Watch mode
npm run test:coverage      # Overall coverage
npm run test:coverage:business  # Business logic coverage
npm run test:coverage:evaluation # Feature-specific coverage
```

## Future Improvements

1. **CI Integration**: Add business logic coverage to CI pipeline
2. **Coverage Badges**: Display business logic coverage in README
3. **Module-Specific Configs**: Create configs for specific modules
4. **Trend Tracking**: Track coverage over time

---

Last Updated: 2025-01-17
Next Review: When adding new modules or changing project structure