# Worktree CI Pipeline Fixes

## 🎯 Purpose
Fix CI/CD pipeline issues in isolated branch without affecting main development.

## 📋 TODO List

### 1. 🔴 **HIGH PRIORITY: E2E Test Failures** (CI Pipeline Optimized)
**Problem:** Web server fails to start in E2E tests
```
Error: Process from config.webServer was not able to start. Exit code: 1
```
**Tasks:**
- [ ] Investigate webServer config in playwright.config.js
- [ ] Check build artifacts availability
- [ ] Verify Next.js start command in CI environment
- [ ] Fix server startup issues
- [ ] Run E2E tests locally to verify

### 2. 🟡 **MEDIUM: Module Resolution Issues** (CI Pipeline)
**Problem:** Old tests using `require` fail with MODULE_NOT_FOUND
```
Error: Cannot find module '@shared/services/platform/web/WebPlatformService'
Require stack:
- /src/tests/utils/createTestContainer.ts
```
**Tasks:**
- [ ] Check vite-tsconfig-paths configuration
- [ ] Verify module resolution in CI environment
- [ ] Consider migrating affected tests to ES6 imports (check CLAUDE.md first!)
- [ ] Test with different Node versions if needed

### 3. 🟢 **LOW: Refactor Skipped Tests**
**Problem:** 8 TablebaseApiClient tests skipped due to unhandled promise rejections
**Files:**
- `src/features/tablebase/services/__tests__/TablebaseApiClient.test.ts`

**Skipped tests:**
- `should clean up pending requests after error`
- `should handle 404 not found without retrying`
- `should exhaust retries and throw final error`
- `should not retry on validation errors`
- `should handle malformed JSON response`
- `should apply exponential backoff with jitter`
- `should cap backoff delay at maximum`
- `should allow new requests after clearing pending ones`

**Tasks:**
- [ ] Refactor tests to properly handle promise rejections
- [ ] Use `expect().rejects.toThrow()` pattern consistently
- [ ] Ensure all promises are awaited or caught
- [ ] Remove `it.skip` after fixing

## 🔧 Testing Commands

```bash
# In worktree directory
cd /home/thehu/coolProjects/EndgameTrainer-ci-fix

# Run all tests
pnpm test

# Run specific test file
pnpm test TablebaseApiClient.test.ts

# Run E2E tests locally
pnpm playwright test

# Run linting
pnpm run lint

# Type check
pnpm tsc

# Build application
pnpm run build
```

## 📊 Success Criteria

- [ ] CI Pipeline passes all checks
- [ ] CI Pipeline (Optimized) passes all checks
- [ ] No unhandled promise rejections in tests
- [ ] E2E tests run successfully
- [ ] Module resolution works in CI environment

## 🚀 Deployment Process

1. Fix issues in worktree
2. Test locally with all commands above
3. Push branch to GitHub
4. Monitor GitHub Actions for success
5. Create PR once all pipelines pass
6. Merge to main after review

## 📝 Notes

- **DO NOT** modify old tests with `require` unless absolutely necessary (see CLAUDE.md)
- CD Pipeline is currently working - don't break it!
- Keep changes minimal and focused on CI fixes only
- Test each fix independently before combining

## 🔗 Related Files

- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/ci-optimized.yml` - Optimized CI pipeline  
- `playwright.config.js` - E2E test configuration
- `vitest.config.ts` - Unit test configuration
- `config/testing/vitest.unit.config.ts` - Unit test config
- `CLAUDE.md` - Project guidelines (check before making changes!)

## 📈 Progress Tracking

- [x] Worktree created and configured
- [ ] E2E test issues investigated
- [ ] E2E test fixes implemented
- [ ] Module resolution investigated
- [ ] Module resolution fixed
- [ ] Skipped tests refactored
- [ ] All pipelines passing
- [ ] PR created
- [ ] Merged to main

---

**Last Updated:** 2025-01-14
**Branch:** `fix/ci-pipeline-issues`
**Worktree:** `/home/thehu/coolProjects/EndgameTrainer-ci-fix`