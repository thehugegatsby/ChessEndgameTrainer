# Store Orchestrators

Complex state operations that coordinate between services and store.

**Key orchestrator:**

- `handlePlayerMove/`: 964 lines across 4 modules, manages sophisticated chess training flow including validation, tablebase quality analysis, pawn promotion with auto-win detection, error dialogs for learning, and opponent simulation

**Responsibilities:**

- Bridge between ChessService and store updates
- Handle async operations (API calls, tablebase queries)
- Manage side effects and error states
- Coordinate multi-step state transitions

**Pattern:** Pure functions that receive store methods and services.

**Detailed docs:** [→ docs/MOVE_HANDLING_ARCHITECTURE.md](../../../docs/MOVE_HANDLING_ARCHITECTURE.md)
