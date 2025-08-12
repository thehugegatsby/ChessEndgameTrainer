# Testing Guidelines

## CRITICAL: Test Execution in WSL

Never use `--` with pnpm test to prevent crashes:

```bash
# ❌ NEVER - crashes in WSL
pnpm test -- --run path/to/test.tsx
pnpm test -- path/to/test.tsx

# ✅ ALWAYS - direct path
pnpm test path/to/test.tsx
```

## Test Commands

```bash
pnpm test                    # all tests
pnpm test path/to/test       # single file/directory
pnpm test:unit               # Jest unit tests only
pnpm test:integration        # Jest integration only
pnpm test:e2e                # Playwright E2E
```

## Framework Selection by Location

### Jest

**Use for:** `src/shared/`, `tests/unit/`, `tests/integration/`
**Example:** Test for `src/shared/utils/chess.ts` → create `tests/unit/chess.test.ts`

### Vitest

**Use for:** `src/features/*/`
**Example:** Test for `src/features/auth/LoginForm.tsx` → create `src/features/auth/LoginForm.test.tsx`
