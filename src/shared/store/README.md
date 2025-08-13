# Store

Zustand-based state management with domain-specific slices.

**Slices:**

- `gameSlice`: Chess game state, board position, move history
- `trainingSlice`: Training mode, difficulty, progress tracking
- `tablebaseSlice`: Tablebase evaluations, cache management
- `uiSlice`: UI state, modals, notifications

**Pattern:** Combined slices in `rootStore.ts`, no context providers needed.

**Critical:** Move handling orchestrated via `orchestrators/handlePlayerMove/`.

**Detailed docs:** [→ docs/SYSTEM_GUIDE.md#state-management](../../../docs/SYSTEM_GUIDE.md#state-management)
