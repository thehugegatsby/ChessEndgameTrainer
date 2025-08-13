# Store Orchestrators

Complex state operations that coordinate between services and store.

**Key orchestrator:**

- `handlePlayerMove/`: 533 lines, manages entire move flow including validation, tablebase lookup, opponent response

**Responsibilities:**

- Bridge between ChessService and store updates
- Handle async operations (API calls, tablebase queries)
- Manage side effects and error states
- Coordinate multi-step state transitions

**Pattern:** Pure functions that receive store methods and services.

**Detailed docs:** [→ docs/MOVE_HANDLING_ARCHITECTURE.md](../../../docs/MOVE_HANDLING_ARCHITECTURE.md)
