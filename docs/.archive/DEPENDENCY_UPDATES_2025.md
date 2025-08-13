# Dependency Updates - January 2025

## Overview

Major dependency updates completed to modernize the codebase and improve security, performance, and developer experience.

## Updated Dependencies

### Major Framework Updates

| Package     | Old Version | New Version | Changes                               |
| ----------- | ----------- | ----------- | ------------------------------------- |
| Next.js     | 15.3.3      | 15.4.5      | Bug fixes, performance improvements   |
| TailwindCSS | 3.4.1       | 4.1.11      | **BREAKING**: CSS-first configuration |
| Firebase    | 11.x        | 12.0.0      | Modular SDK improvements              |

### Development Dependencies

| Package        | Old Version | New Version | Changes                  |
| -------------- | ----------- | ----------- | ------------------------ |
| @types/jest    | 29.5.12     | 29.5.14     | Type definition updates  |
| @types/node    | 20.14.13    | 22.13.4     | Node.js 22 type support  |
| cross-env      | 7.0.3       | 7.0.6       | Bug fixes                |
| glob           | 10.4.5      | 11.0.0      | Performance improvements |
| tailwind-merge | 2.4.0       | 2.7.0       | New utility support      |

## Breaking Changes

### TailwindCSS 4.x Migration

The most significant change is the migration to TailwindCSS 4.x, which uses a CSS-first configuration:

**Before**:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { ... } }
}
```

**After**:

```css
/* tailwind.config.css */
@import "tailwindcss";
@source "./pages/**/*.{js,ts,jsx,tsx}";
@theme {
  /* CSS custom properties */
}
```

See [TAILWIND_4_MIGRATION.md](./TAILWIND_4_MIGRATION.md) for detailed migration guide.

### Firebase 12.0.0

- No breaking changes in our usage
- Improved tree-shaking and bundle size
- Better TypeScript types

## Technical Debt Resolved

### Code Cleanup

- Removed 869 lines of unused settings code
- Fixed 13 `any` type usage instances
- Removed unused functions and types
- Replaced console.log with Logger service (where safe)

### Circular Dependency Fix

- Resolved circular dependency between Logger and WebPlatformService
- WebPlatformService now uses console.error directly for logging errors

### Test Suite Updates

- Updated validation tests to match chess.js behavior
- All 691 tests passing
- Fixed FEN validation to use chess.js wrapper

## Performance Improvements

1. **Bundle Size**: TailwindCSS 4.x provides better tree-shaking
2. **Build Speed**: CSS-first configuration builds faster
3. **Type Safety**: Updated TypeScript definitions improve IDE performance
4. **Firebase SDK**: v12 has smaller bundle size with better code splitting

## Migration Checklist

- [x] Update all dependencies to latest versions
- [x] Migrate TailwindCSS to v4.x CSS-first config
- [x] Fix all TypeScript errors
- [x] Update all tests to pass
- [x] Update documentation
- [x] Test production build
- [x] Deploy with PM2

## Rollback Plan

If issues arise:

1. Git revert to commit before updates
2. Run `npm install` to restore old dependencies
3. Restart PM2: `pm2 restart all`

## Monitoring

Post-deployment monitoring points:

- Bundle size comparison
- Build time metrics
- Runtime performance
- Error rates in production

## Next Steps

1. Monitor for any runtime issues
2. Consider enabling TailwindCSS JIT mode
3. Evaluate Next.js 15.5 when released
4. Plan for React 19 migration (when stable)
