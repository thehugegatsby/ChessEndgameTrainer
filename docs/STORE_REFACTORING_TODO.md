# Store Refactoring TODO Plan

## Overview

This document outlines the granular improvements needed for the Zustand store architecture following the Phase 8 refactoring. While the major architectural transformation is complete, several naming inconsistencies and minor structural improvements have been identified.

## Priority Levels

- 🔴 **High Priority**: Breaking changes or significant inconsistencies
- 🟡 **Medium Priority**: Non-breaking improvements for consistency
- 🟢 **Low Priority**: Nice-to-have enhancements

## TODO Items

### 1. Fix Naming Inconsistencies in UISlice 🔴

**What needs to change:**

- Rename `sidebarOpen` → `isSidebarOpen`
- Rename `modalOpen` → `currentModal` (it's not a boolean, it's `ModalType | null`)

**Reasoning:**

- Boolean properties should have `is/has/should` prefix for clarity
- `modalOpen` is misleading since it stores the modal type, not a boolean
- This follows TypeScript/React best practices

**Files to update:**

- `/shared/store/slices/uiSlice.ts`
- `/shared/store/hooks/useUIStore.ts`
- All components using these properties

**Breaking change:** Yes - will require updating all consumers

---

### 2. Move UI State from TrainingSlice to UISlice 🔴

**What needs to change:**

- Move `moveErrorDialog` from TrainingSlice to UISlice
- Update all references to use UISlice

**Reasoning:**

- Dialog state is UI concern, not training logic
- Follows single responsibility principle
- Keeps slices focused on their domain

**Files to update:**

- `/shared/store/slices/trainingSlice.ts` (remove)
- `/shared/store/slices/uiSlice.ts` (add)
- `/shared/store/hooks/useUIStore.ts` (update reference)
- Components using `moveErrorDialog`

**Breaking change:** Yes - state location changes

---

### 3. Fix Missing Action in UISlice 🔴

**What needs to change:**

- Add `setMoveErrorDialog` action to UISlice (currently referenced but missing)

**Reasoning:**

- `useUIStore` hook references this action but it doesn't exist
- Needed for managing error dialog state
- Completes the UI state management

**Implementation:**

```typescript
setMoveErrorDialog: (dialog: MoveErrorDialog | null) =>
  set({ moveErrorDialog: dialog });
```

---

### 4. Standardize Action Naming in TrainingSlice 🟡

**What needs to change:**

- Rename `useHint` → `incrementHint` (to match `incrementMistake` pattern)
- Or rename both to `addHint` and `addMistake` for better semantics

**Reasoning:**

- Consistent verb patterns improve API predictability
- `use` is ambiguous - does it increment or just mark as used?
- `increment` or `add` clearly indicates state mutation

**Files to update:**

- `/shared/store/slices/trainingSlice.ts`
- `/shared/store/hooks/useTrainingStore.ts`
- Components using these actions

---

### 5. Create Missing Consolidated Hooks 🟡

**What needs to change:**
Create consolidated hooks for:

- `useProgressStore` (ProgressSlice)
- `useSettingsStore` (SettingsSlice)
- `useUserStore` (UserSlice)
- `useTablebaseStore` (TablebaseSlice)

**Reasoning:**

- Only 3/7 slices have consolidated hooks
- Inconsistent developer experience
- Consolidated hooks provide better TypeScript support and performance

**New files to create:**

- `/shared/store/hooks/useProgressStore.ts`
- `/shared/store/hooks/useSettingsStore.ts`
- `/shared/store/hooks/useUserStore.ts`
- `/shared/store/hooks/useTablebaseStore.ts`

---

### 6. Refactor Complex Orchestrator 🟡

**What needs to change:**

- Break down `handlePlayerMove.ts` (429 lines) into smaller functions
- Extract validation logic into separate functions
- Extract tablebase interaction into separate functions
- Extract progress tracking into separate functions

**Reasoning:**

- Single function with 429 lines violates clean code principles
- Hard to test and maintain
- Multiple responsibilities in one function

**Suggested structure:**

```
handlePlayerMove/
  ├── index.ts (main orchestrator)
  ├── validateMove.ts
  ├── processTablebaseResponse.ts
  ├── updateProgress.ts
  └── handleMoveEffects.ts
```

---

### 7. Add Setter Naming Consistency 🟢

**What needs to change:**

- Review all boolean setters to ensure they follow `setIs*` pattern
- Example: `setSidebarOpen` → `setIsSidebarOpen` (to match property name)

**Reasoning:**

- Consistent naming between state properties and their setters
- Reduces cognitive load when using the API
- Makes auto-complete more predictable

---

### 8. Document State Patterns 🟢

**What needs to change:**

- Add documentation for the three-state pattern (`undefined | null | value`)
- Document when to use which pattern
- Add examples in slice files

**Reasoning:**

- `tablebaseMove` uses `undefined | null | string` pattern
- This pattern is not immediately obvious
- New developers need to understand the semantic differences

**Example documentation:**

```typescript
/**
 * Three-state pattern:
 * - undefined: Not yet checked/loaded
 * - null: Checked but no value (e.g., draw position)
 * - string: Valid value exists
 */
```

---

## Implementation Order

1. **Phase 1 - Breaking Changes** (Do together to minimize disruption)
   - Fix UISlice naming (sidebarOpen, modalOpen)
   - Move moveErrorDialog to UISlice
   - Add missing setMoveErrorDialog action

2. **Phase 2 - Non-Breaking Improvements**
   - Standardize action naming
   - Create missing consolidated hooks
   - Add setter naming consistency

3. **Phase 3 - Refactoring**
   - Break down complex orchestrator
   - Document state patterns

## Testing Strategy

For each change:

1. Update unit tests for affected slices
2. Update integration tests for affected hooks
3. Run full test suite (700+ tests)
4. Manual testing of affected UI components
5. Verify TypeScript compilation (0 errors)

## Migration Guide

For breaking changes, provide migration examples:

```typescript
// Before
const { sidebarOpen, modalOpen } = useUIStore();
if (modalOpen === 'settings') { ... }

// After
const { isSidebarOpen, currentModal } = useUIStore();
if (currentModal === 'settings') { ... }
```

## Success Metrics

- ✅ All 700+ tests passing
- ✅ 0 TypeScript errors
- ✅ Consistent naming across all slices
- ✅ All slices have consolidated hooks
- ✅ No functions over 100 lines
- ✅ Clear domain separation maintained
