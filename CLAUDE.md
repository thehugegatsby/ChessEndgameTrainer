# CLAUDE.md - AI Assistant Context

## 🤖 How to Use This System Prompt
This file provides high-level context and architectural guidance for AI assistants working on the ChessEndgameTrainer project. It works in conjunction with:
- **AGENT_CONFIG.json** - Strict, machine-enforceable rules and automation workflows
- **TODO.md** - Current sprint priorities and task tracking
- **docs/** - Detailed technical documentation

**Always read both CLAUDE.md and AGENT_CONFIG.json at the start of each session!**

## WICHTIGE ARCHITEKTUR-PRINZIPIEN
**IMMER die sauberste, langfristig beste Lösung wählen!**
- Keine pragmatischen Workarounds oder Quick-Fixes
- Single Source of Truth bevorzugen
- Klare Trennung von Verantwortlichkeiten
- Wartbarkeit und Erweiterbarkeit priorisieren
- Technische Schulden vermeiden

⚠️ **See AGENT_CONFIG.json for strict quality gates and enforcement rules!**

## Project Overview
**ChessEndgameTrainer** - Web/Mobile chess endgame training app with AI engine integration.

## Tech Stack
- **Frontend**: Next.js 15.3, React 18.3, TypeScript 5.3
- **UI**: Tailwind CSS 3.4, Radix UI, react-chessboard 4.3
- **State**: Zustand 4.4 (Single Source of Truth)
- **Chess**: chess.js 1.0.0-beta.6, Stockfish WASM (NNUE)
- **Testing**: Jest 29.7, React Testing Library 14.1
- **Mobile**: React Native 0.73 (prepared, not implemented)
- **Database**: Firebase Firestore (optional, with fallback)

## Project Structure
```
/
├── pages/              # Next.js pages (train/[id].tsx main)
├── shared/             # 80% shared code (web + mobile ready)
│   ├── components/     # UI components
│   ├── hooks/         # Business logic hooks
│   ├── lib/           # Core libraries (chess engine)
│   ├── services/      # Platform services
│   ├── utils/         # Utilities
│   └── types/         # TypeScript types
├── tests/             # Test suites
└── public/            # Static assets + stockfish.wasm
```

## Essential Commands
```bash
npm run dev              # Dev server (port 3002)
npm run dev:config       # Dev server using central config
npm test                 # Run tests
npm run lint            # ESLint
npm run build           # Production build
npm run check-duplicates # Find duplicate components
npm run analyze-code    # Run all code analysis
npm run test:e2e         # E2E tests with Playwright
```

### Test Environment Setup
E2E tests use MockEngineService for instant, deterministic responses.

```bash
# Start dev server:
npm run dev

# Run ALL E2E tests:
npm run test:e2e

# Run specific E2E test file (WICHTIG: Use npx, NOT npm!):
npx playwright test tests/e2e/bridge-building.spec.ts --project=chromium

# Run with visible browser:
npx playwright test tests/e2e/bridge-building.spec.ts --headed

# Debug mode:
npx playwright test tests/e2e/bridge-building.spec.ts --debug
```

⚠️ **WICHTIG**: Für spezifische Test-Dateien IMMER `npx playwright test` verwenden, NICHT `npm run test:e2e -- file`!

## Configuration
- **Central Config**: `/config/constants.ts` - Contains DEV_PORT (3002) and URLs
- **Environment**: `.env.development` - Development environment variables
- **Playwright**: Uses `APP_CONFIG.DEV_URL` from central config

## Key Architecture Decisions

### 1. Singleton Pattern for Engine
- `Engine.getInstance()` - Only ONE Stockfish instance
- Mobile constraint: ~20MB memory per worker
- Always call `quit()` on cleanup

### 2. Stable References in Hooks
- `useChessGame` uses useRef + useMemo for game instance
- Prevents infinite loops in React components
- Version tracking triggers re-renders

### 3. Dual Evaluation System
- Engine evaluation (Stockfish)
- Tablebase lookup (7-piece endgames)
- Unified through evaluation pipeline

### 4. Error Boundaries
- Centralized ErrorService
- FEN validation at all boundaries
- Graceful fallbacks

## Code Conventions

### TypeScript
- Strict mode preferred
- No `any` types
- Interfaces over types for objects

### React Patterns
```typescript
// Hooks for logic separation
const useChessLogic = () => { /* logic */ };
const ChessComponent = () => {
  const logic = useChessLogic();
  return <UI {...logic} />;
};
```

### Error Handling
```typescript
try {
  await riskyOperation();
} catch (error) {
  ErrorService.logError('Context', error);
  // Graceful degradation
}
```

### Testing
- Minimum 80% coverage for new features
- Mock Worker APIs properly
- Use factory patterns for test data

## Performance Constraints
- Mobile: Max 1 engine instance
- Debounce evaluations (300ms)
- LRU cache: 200 items max
- Touch targets: minimum 44px

## Security Requirements
- Validate all FEN inputs
- Sanitize user-generated content
- No hardcoded credentials
- Path validation for workers

## Current Focus Areas
1. Brückenbau-Trainer UI integration (Phase P3)
2. Fix remaining ~17 Playwright E2E tests (reduced from 42)
3. Engine memory management improvements
4. Mobile platform abstraction layer

## Test Helpers
E2E tests use centralized helpers in `tests/e2e/helpers.ts`:
- `makeMove(page, notation)` - Execute moves via test hooks
- `waitForEngineResponse(page, moveCount)` - Wait for engine
- `getGameState(page)` - Get current game state
- `verifyPosition(page, fen)` - Verify board position

## Important Notes
- WASM requires specific server headers
- iOS Safari may terminate workers
- Firestore is optional (fallback to local data)
- All times in milliseconds

## 📋 Development Workflow

### Pre-Implementation Checklist
Before starting any new feature or fix:
1. ✅ Read current sprint priorities in TODO.md
2. ✅ Check AGENT_CONFIG.json quality gates
3. ✅ Verify no duplicate functionality exists
4. ✅ Ensure approach aligns with architecture principles
5. ✅ Define test strategy upfront

### During Implementation
Follow the mandatory workflow steps defined in AGENT_CONFIG.json:
- **Context Refresh** → **Pre-Implementation Check** → **Implementation** → **Testing Gate** → **Documentation Update** → **Final Verification**

### Post-Implementation Requirements
1. All tests must pass (`npm test`)
2. Linting must pass (`npm run lint`)
3. Build must succeed (`npm run build`)
4. Documentation must be updated
5. CHANGELOG.md must have entry

### Documentation Update Matrix
| Change Type | Required Updates |
|------------|------------------|
| New Feature | README.md, CHANGELOG.md, docs/INDEX.md |
| API Change | docs/API.md, CHANGELOG.md, Migration guide |
| Security Fix | docs/SECURITY.md, CHANGELOG.md |
| Architecture | docs/ARCHITECTURE.md, CLAUDE.md |
| Testing | docs/TESTING.md, testing guidelines |

## 🚨 Quality Assurance Workflow

### Automated Checks (Enforced by AGENT_CONFIG.json)
- Test coverage ≥78% (business logic)
- Bundle size <300KB per route
- Performance metrics maintained
- TypeScript strict mode compliance
- No `any` types

### Manual Verification
- UI changes tested in browser
- Mobile responsiveness verified
- Store remains single source of truth
- No performance regressions
- Security requirements maintained

### Common Pitfalls to Avoid
1. **Direct Chess.js manipulation** - Always use Store actions
2. **Ignoring debouncing** - 300ms for all user inputs
3. **Creating new Engine instances** - Use singleton pattern
4. **Skipping tests** - TDD preferred, tests required
5. **Quick fixes** - Always choose clean, long-term solutions

## 🔗 Related Documentation
- **AGENT_CONFIG.json** - Strict automation rules and quality gates
- **TODO.md** - Current sprint and priorities
- **docs/ARCHITECTURE.md** - Detailed system design
- **docs/TESTING.md** - Comprehensive test strategy
- **docs/SECURITY.md** - Security implementation status