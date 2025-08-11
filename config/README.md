# Configuration Directory Structure

This directory contains all project configurations, organized by domain.

## Structure

```
/config/
├── build/          # Build tools (SWC, Babel, Webpack)
├── env/            # Environment variables and examples
├── firebase/       # Firebase configuration
├── linting/        # ESLint, Prettier configurations
├── next/           # Next.js specific configs
├── testing/        # Jest, Vitest, Playwright configs
└── ports.ts        # Centralized port configuration
```

## Proxy Pattern

To maintain tool compatibility, the root directory contains proxy files that re-export from this directory:

- `.eslintrc.js` → `./config/linting/eslint.config.json`
- `jest.config.ts` → `./config/testing/jest.config`
- `vitest.config.ts` → `./config/testing/vitest.config`
- `playwright.config.ts` → `./config/testing/playwright.config`

## TypeScript Configs

- Main app: `/tsconfig.json` (strict rules)
- Config files: `/config/testing/tsconfig.json` (relaxed rules for Node.js configs)

## Why This Structure?

- **Centralized**: All configs in one place
- **Organized**: Grouped by domain/tool
- **Clean Root**: Only essential files in project root
- **Type-Safe**: TypeScript configs where beneficial
- **Tool-Compatible**: Proxy pattern maintains compatibility
