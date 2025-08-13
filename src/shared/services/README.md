# Services

Singleton service instances for chess logic and external integrations.

**Key Services:**

- `ChessService`: Core chess game logic, move validation
- `TablebaseService`: Lichess tablebase API integration
- `ErrorService`: Centralized error handling
- `Logger`: Application-wide logging with remote transport

**Pattern:** Singleton instances, imported directly, no DI framework.

**Detailed docs:** [→ docs/SYSTEM_GUIDE.md#services](../../../docs/SYSTEM_GUIDE.md#services)
