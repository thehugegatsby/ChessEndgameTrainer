# Glossary

<!-- nav: docs/README#architecture | tags: [glossary, terms] | updated: 2025-08-12 -->

Essential terms for Chess Endgame Trainer development.

## Chess Terms

| Term          | Definition                                                |
| ------------- | --------------------------------------------------------- |
| **FEN**       | Forsyth-Edwards Notation - standard chess position format |
| **PGN**       | Portable Game Notation - chess game/move recording format |
| **WDL**       | Win/Draw/Loss - tablebase evaluation values (-2 to +2)    |
| **Tablebase** | Endgame database with perfect play evaluation             |
| **Endgame**   | Chess position with few pieces (≤7 pieces total)          |

## Architecture Terms

| Term             | Definition                                           |
| ---------------- | ---------------------------------------------------- |
| **Slice**        | Zustand state domain (Game, Training, Tablebase, UI) |
| **Orchestrator** | Business logic coordinating multiple slices          |
| **Service**      | External dependency wrapper (Chess, Tablebase)       |
| **Hook**         | React hook for component-store interaction           |
| **Container**    | Component managing state/logic (vs Presentation)     |

## Technical Terms

| Term      | Definition                                            |
| --------- | ----------------------------------------------------- |
| **WSL2**  | Windows Subsystem for Linux - our runtime environment |
| **MCP**   | Model Context Protocol - tool integration standard    |
| **LRU**   | Least Recently Used cache eviction strategy           |
| **Zod**   | TypeScript-first schema validation library            |
| **Immer** | Immutable state updates with mutable syntax           |

## Move Handling Terms

| Term                  | Definition                                     |
| --------------------- | ---------------------------------------------- |
| **Move Quality**      | Evaluation if move maintains/improves position |
| **Suboptimal Move**   | Move that worsens position evaluation          |
| **Opponent Turn**     | Scheduled async move by computer opponent      |
| **Move Error Dialog** | UI shown for suboptimal player moves           |
| **Validation**        | Check if move is legal in current position     |

## State Management Terms

| Term               | Definition                                   |
| ------------------ | -------------------------------------------- |
| **Root Store**     | Central Zustand store combining all slices   |
| **State Update**   | Immutable state change via Immer             |
| **Store Action**   | Function that modifies slice state           |
| **Store Selector** | Function extracting specific state data      |
| **Side Effect**    | External operation triggered by state change |

## Testing Terms

| Term             | Definition                              |
| ---------------- | --------------------------------------- |
| **Jest**         | Test framework for `src/shared/` code   |
| **Vitest**       | Test framework for `src/features/` code |
| **MSW**          | Mock Service Worker for API mocking     |
| **TestFixtures** | Validated chess positions for tests     |
| **E2E**          | End-to-end browser automation tests     |

## Development Terms

| Term                 | Definition                                      |
| -------------------- | ----------------------------------------------- |
| **pnpm**             | Package manager (NOT npm) - required for WSL    |
| **Lint**             | Code style/quality checking (ESLint + Prettier) |
| **TypeScript Check** | Type validation without compilation             |
| **Pre-commit Hook**  | Validation script before git commit             |
| **Hot Reload**       | Live code updates during development            |
