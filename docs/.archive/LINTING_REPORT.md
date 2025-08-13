# Linting Report - 2025-08-13

## Executive Summary

| Tool | Issues Found | Severity |
|------|-------------|----------|
| TypeScript | 6 errors | 🔴 High |
| ESLint | 43 warnings | 🟡 Medium |
| Prettier | 310 files | 🟠 Low |

---

## TypeScript Errors (6)

All TypeScript errors are related to deleted tablebase-demo directories:

```
.next/types/app/tablebase-demo.disabled/page.ts(2,24): error TS2307: Cannot find module
.next/types/app/tablebase-demo.disabled/page.ts(5,29): error TS2307: Cannot find module
.next/types/app/tablebase-demo.disabled/tablebase-demo/page.ts(2,24): error TS2307: Cannot find module
.next/types/app/tablebase-demo.disabled/tablebase-demo/page.ts(5,29): error TS2307: Cannot find module
.next/types/app/tablebase-demo/page.ts(2,24): error TS2307: Cannot find module
.next/types/app/tablebase-demo/page.ts(5,29): error TS2307: Cannot find module
```

**Root Cause:** Next.js generated type files for deleted demo directories
**Fix:** Delete `.next` directory or run `pnpm build` to regenerate

---

## ESLint Warnings (43)

### Complexity Issues (6)
- `MoveValidator.validateEnPassant()` - complexity 20 (max 18)
- `TablebaseIntegration` arrow function - complexity 19 (max 18)
- `AnalysisPanel` arrow function - complexity 20 (max 18)
- `TrainingBoard` arrow function - complexity 19 (max 18)
- `useMoveQuality` arrow function - complexity 20 (max 18)

### Function Length Issues (8)
- `AdvancedEndgameMenu` - 300 lines (max 170)
- `MoveHistory` - 204 lines (max 170)
- `MovePanelZustand` - 171 lines (max 170)
- `TrainingBoard` - 188 lines (max 170)
- `CommandPalette` - 189 lines (max 170)
- `useMoveHandlers` - 171 lines (max 170)
- `useMoveQuality` - 260 lines (max 170)
- `useProgressSync` - 373 lines (max 170)

### React Issues (5)
- Array index as key in 3 components
- Nested ternary expressions in 3 locations

### Other Warnings (24)
- Various minor style violations

---

## Prettier Formatting (310 files)

310 files have formatting inconsistencies. Main patterns:

### Most affected directories:
- `src/tests/` - majority of test files
- `src/shared/` - many component files
- `src/features/` - feature module files

### Common issues:
- Inconsistent indentation
- Missing trailing commas
- Line length violations
- Spacing inconsistencies

---

## Recommendations

### Immediate Actions (No Code Changes)
1. **TypeScript:** Clean `.next` directory with `rm -rf .next`
2. **Documentation:** Update complex functions with explanatory comments

### Future Refactoring Priorities
1. **High Priority:** Break down functions >170 lines
   - `useProgressSync` (373 lines!) 
   - `AdvancedEndgameMenu` (300 lines)
   - `useMoveQuality` (260 lines)

2. **Medium Priority:** Reduce complexity in validation functions
   - Split complex conditionals into helper functions
   - Extract validation logic into smaller units

3. **Low Priority:** Run Prettier formatting
   - Can be done with `pnpm prettier --write "src/**/*.{ts,tsx}"`
   - Non-breaking, purely cosmetic

---

## CI/CD Impact

Current state will NOT block builds:
- ✅ TypeScript errors are in `.next` (build artifact)
- ✅ ESLint only has warnings (no errors)
- ✅ Prettier issues are cosmetic

---

## Commands to Reproduce

```bash
# TypeScript check
pnpm tsc --noEmit

# ESLint
pnpm lint

# Prettier check
pnpm prettier --check "src/**/*.{ts,tsx,js,jsx,json,css}"
```