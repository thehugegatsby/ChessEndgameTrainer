# CI/CD Pipeline Guide

## Overview
This project uses GitHub Actions for continuous integration and deployment. The pipeline ensures code quality, test coverage, and automated deployments.

## Pipeline Structure

### 1. CI Pipeline (`ci.yml`)
Runs on every push and pull request.

#### Jobs:
- **Lint & Type Check**: ESLint and TypeScript validation
- **Unit Tests**: Runs unit tests with coverage reporting
- **Integration Tests**: Runs integration tests separately
- **Build**: Verifies the Next.js build succeeds
- **Coverage Report**: Merges coverage and checks 80% threshold
- **Quality Gates**: Final summary of all checks

### 2. PR Checks (`pr-checks.yml`)
Additional checks for pull requests:
- **PR Size Analysis**: Warns for large PRs
- **Coverage Diff**: Ensures coverage doesn't decrease
- **Schema Changes**: Alerts for potential migration needs
- **Security Scan**: npm audit and secret detection
- **Bundle Size**: Monitors build size

### 3. CD Pipeline (`cd.yml`)
Deploys to production on main branch:
- **Deploy to Vercel**: Production deployment
- **Post-Deployment Tests**: Smoke tests and health checks
- **Create Release**: Automated GitHub releases

### 4. Dependency Updates (`dependency-updates.yml`)
Weekly automated dependency checks:
- **Outdated Check**: Reports outdated packages
- **Auto-Update**: Creates PRs for patch/minor updates

## Setup Instructions

### 1. Required GitHub Secrets
Set these in your repository settings:
```
VERCEL_TOKEN         # From Vercel dashboard
VERCEL_ORG_ID        # Your Vercel organization ID
VERCEL_PROJECT_ID    # Your Vercel project ID
PRODUCTION_URL       # Your production URL for health checks
```

### 2. Enable GitHub Actions
1. Go to Settings → Actions → General
2. Enable "Allow all actions and reusable workflows"
3. Set workflow permissions to "Read and write permissions"

### 3. Configure Branch Protection
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable required status checks (see `.github/branch-protection.json`)
4. Require PR reviews before merging

## Local Development

### Running CI Checks Locally
```bash
# Run all CI checks
npm run ci:test

# Individual checks
npm run lint
npm run tsc -- --noEmit
npm test
npm run build
```

### Pre-commit Hook
Install husky for automatic pre-commit checks:
```bash
npx husky-init && npm install
npx husky add .husky/pre-commit "npm run pre-commit"
```

## Quality Gates

### Coverage Requirements
- **Goal**: 80% statement coverage
- **Current**: 76.16% (as of last update)
- Pipeline fails if coverage drops below threshold

### Test Categories
- **Unit Tests**: `/tests/unit/`
- **Integration Tests**: `/tests/integration/`
- **Performance Tests**: `/tests/performance/`
- **E2E Tests**: `/tests/e2e/` (Playwright)

### Code Quality
- ESLint rules enforced
- TypeScript strict mode
- No console.logs in production
- Bundle size < 300MB

## Deployment Strategy

### Environments
1. **Development**: Local development
2. **Preview**: Vercel preview deployments for PRs
3. **Production**: Main branch auto-deploys to Vercel

### Deployment Process
1. PR merged to main
2. CI pipeline runs all tests
3. Build created and optimized
4. Deploy to Vercel
5. Post-deployment health checks
6. Create GitHub release

## Troubleshooting

### Common Issues

#### Tests Failing in CI but Not Locally
- Check Node version matches CI (v20)
- Clear node_modules and reinstall: `rm -rf node_modules && npm ci`
- Check for environment-specific code

#### Coverage Dropping
- New code must include tests
- Check coverage report: `npm run test:coverage`
- Focus on critical paths first

#### Build Failures
- Check for TypeScript errors: `npm run tsc -- --noEmit`
- Verify all imports are correct
- Check environment variables

#### Deployment Failures
- Verify Vercel secrets are set correctly
- Check Vercel build logs
- Ensure WASM files are included in build

## Best Practices

### Writing Tests
1. Follow the test structure in `/tests/`
2. Use proper mocks for external dependencies
3. Test both success and error cases
4. Keep tests focused and isolated

### PR Guidelines
1. Keep PRs small and focused
2. Write descriptive commit messages
3. Update tests for new features
4. Check CI status before requesting review

### Performance
1. Monitor bundle size in PR checks
2. Use lazy loading for large components
3. Optimize images and assets
4. Review Lighthouse scores

## Monitoring

### Metrics to Track
- Test success rate (Goal: 100%)
- Coverage percentage (Goal: 80%+)
- Build time (Target: < 5 minutes)
- Bundle size (Target: < 300MB)
- Deployment success rate

### Alerts
Set up GitHub notifications for:
- Failed deployments
- Security vulnerabilities
- Large bundle size increases
- Coverage drops

## Future Improvements

### Planned Enhancements
1. [ ] Add visual regression testing
2. [ ] Implement performance budgets
3. [ ] Add Lighthouse CI integration
4. [ ] Set up error tracking (Sentry)
5. [ ] Add A/B testing framework
6. [ ] Implement feature flags

### Mobile CI/CD
When mobile development begins:
1. Add Expo EAS Build integration
2. Set up TestFlight/Play Store deployments
3. Add device testing matrix
4. Implement crash reporting

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Jest Testing Best Practices](https://jestjs.io/docs/best-practices)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

Last Updated: 2025-01-06