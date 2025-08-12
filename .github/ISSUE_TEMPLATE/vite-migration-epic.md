---
name: Vite Migration Epic
about: Main epic for migrating from Next.js to Vite
title: "[EPIC] Migrate from Next.js to Vite"
labels: epic, migration, architecture, blocked
assignees: ""
---

```yaml
type: epic
priority: high
status: blocked
blocker: "#137 - Feature-based Architecture Migration"
effort: 10-15 days
ai_context:
  current_stack: Next.js 15, App Router, TypeScript
  target_stack: Vite 6, React Router, TypeScript
  complexity: high
  risk_level: medium
```

## 📋 Epic Overview

Migrate the Chess Endgame Trainer from Next.js to Vite for improved development experience and performance.

## 🚫 Blocker

**This epic is BLOCKED by Epic #137 (Feature-based Architecture Migration)**

- Cannot start until feature migration is complete
- Attempting both migrations simultaneously would cause conflicts
- Wait for #137 completion signal

## 🎯 Objectives

1. **Development Speed**: Faster HMR and build times
2. **Simplicity**: Remove Next.js complexity for client-side app
3. **Bundle Size**: Reduce production bundle by ~30%
4. **Test Performance**: Native Vitest integration
5. **Developer Experience**: Better error messages and debugging

## 📊 Success Criteria

- [ ] All features working identically to Next.js version
- [ ] Build time < 10 seconds
- [ ] HMR < 100ms
- [ ] Bundle size < 200KB per route
- [ ] All tests passing in Vitest
- [ ] Zero regression in user functionality

## 🏗️ Migration Phases

### Phase 1: Planning & Setup (Story #1)

- Environment setup
- Dependency analysis
- Route mapping
- Configuration planning

### Phase 2: Core Infrastructure (Story #2)

- Vite configuration
- Build pipeline
- Development server
- Environment variables

### Phase 3: Routing Migration (Story #3)

- React Router setup
- Route definitions
- Dynamic imports
- Navigation guards

### Phase 4: Feature Migration (Story #4)

- Training features
- Dashboard
- Progress tracking
- Settings

### Phase 5: Asset & Style Migration (Story #5)

- Static assets
- CSS modules
- Tailwind setup
- Font optimization

### Phase 6: Testing Migration (Story #6)

- Vitest configuration
- Test migration
- Coverage setup
- E2E updates

### Phase 7: Deployment (Story #7)

- Vercel configuration
- Build optimization
- Preview deployments
- Production release

## 🔧 Technical Considerations

### Next.js Features to Replace

- App Router → React Router v7
- API Routes → Direct service calls
- Image optimization → Vite plugins
- Font optimization → CSS loading
- Middleware → React Router guards

### Path Aliases to Maintain

```typescript
{
  "@shared/*": ["src/shared/*"],
  "@features/*": ["src/features/*"],
  "@training/*": ["src/features/training/*"]
}
```

### Dependencies to Add

- vite
- @vitejs/plugin-react
- react-router-dom
- vite-tsconfig-paths

### Dependencies to Remove

- next
- @next/\*
- next-specific plugins

## 📈 Risk Mitigation

1. **Feature Branch Strategy**: All work in `feature/vite-migration`
2. **Parallel Testing**: Keep Next.js working until Vite is stable
3. **Incremental Migration**: Route-by-route if needed
4. **Rollback Plan**: Git revert if critical issues

## 📝 Documentation Requirements

- [ ] Migration guide for team
- [ ] Updated README
- [ ] New developer setup docs
- [ ] Deployment guide
- [ ] Troubleshooting guide

## 🔗 Related Issues

- Blocks: #137 (Feature-based Architecture Migration)
- Stories: (to be created)
- Reference: Current Next.js setup in PROJECT_STRUCTURE.md

## 💬 Notes for AI Assistants

When working on this epic:

1. Always check #137 status first
2. Read PROJECT_STRUCTURE.md for current architecture
3. Maintain all TypeScript path aliases
4. Test each phase thoroughly before proceeding
5. Keep feature flags for gradual rollout

## ✅ Definition of Done

- [ ] All stories completed
- [ ] No regressions in functionality
- [ ] Performance metrics met
- [ ] Documentation updated
- [ ] Team trained on new setup
- [ ] Old Next.js code removed
- [ ] Production deployment successful
