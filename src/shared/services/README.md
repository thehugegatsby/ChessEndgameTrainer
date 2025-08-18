# Services

Service instances for external integrations and cross-cutting concerns.

**Key Services:**

- `TablebaseService`: Lichess tablebase API integration
- `ErrorService`: Centralized error handling
- `Logger`: Application-wide logging with remote transport

**Pattern:** Singleton instances, imported directly, no DI framework.

**Detailed docs:** [→ docs/SYSTEM_GUIDE.md#services](../../../docs/SYSTEM_GUIDE.md#services)
