# TECH-002: React Chessboard Upgrade Spike

**Date**: 2025-01-10  
**Author**: Claude with Gemini 2.5 Pro & O3-Mini consensus  
**Status**: IN PROGRESS

## Executive Summary

Investigating upgrade from react-chessboard v2.1.3 to v5.1.0 (major version jump).

## Current State

- **Current Version**: 2.1.3
- **Target Version**: 5.1.0
- **Version Gap**: 3 major versions (significant API changes expected)

## Initial Findings

### Version History
- v5.0.0 (July 2, 2025): Major rewrite with breaking changes
- v5.1.0: Added `onArrowsChange` prop
- Documentation: https://react-chessboard.vercel.app

### Known Breaking Changes
1. **customSquareRenderer** - Already removed in our codebase (was causing TypeScript errors)
2. Major API restructuring in v5.0.0
3. New documentation suggests significant changes

## Investigation Results

### 1. Security Analysis ✅
- **npm audit result**: NO vulnerabilities in react-chessboard v2.1.3
- No security imperative for upgrade

### 2. API Analysis ✅
**v2.1.3 (current)**:
```tsx
<Chessboard 
  position={currentFen}
  onPieceDrop={onDrop}
  arePiecesDraggable={!isGameFinished}
  boardWidth={600}
/>
```

**v5.x (new)**:
```tsx
<Chessboard 
  options={{
    position: currentFen,
    onPieceDrop: onDrop,
    arePiecesDraggable: !isGameFinished,
    boardWidth: 600
  }}
/>
```

### 3. Impact Assessment ✅

#### Code Changes Required:
- TrainingBoardZustand.tsx - complete prop restructuring
- Type imports from 'react-chessboard/dist/chessboard/types'
- All tests using Chessboard component
- Unknown additional breaking changes

#### Effort Estimate:
- **Refactoring**: 1-2 days
- **Testing**: 1 day
- **Bug fixes**: Unknown
- **Total**: 3-5 days minimum

### 4. Risk-Benefit Analysis ✅

**Risks**:
- High refactoring effort
- Potential new bugs
- Unknown breaking changes
- E2E test updates needed
- Possible DOM structure changes affecting selectors

**Benefits**:
- Latest features (unclear if needed)
- Active maintenance
- Potential performance improvements (unquantified)

## LLM Consensus

Both **Gemini 2.5 Pro** and **O3-Mini** unanimously recommend:
> **Stay with v2.1.3**

### Gemini's Key Points:
- No security vulnerabilities = no urgent need
- High refactoring cost without clear benefit
- Risk of introducing new bugs

### O3's Key Points:
- Risk-reward ratio not favorable
- Stability more important than latest version
- No compelling features identified in v5.x

## Final Recommendation

### ❌ DO NOT UPGRADE to v5.x at this time

**Rationale**:
1. **No security issues** in current version
2. **High cost** (3-5 days) with **unclear benefits**
3. **Stability risk** from major API changes
4. **No feature requirements** driving the upgrade

### Future Considerations
- Re-evaluate if:
  - Security vulnerability discovered in v2.1.3
  - Specific v5.x feature becomes necessary
  - Major refactoring planned anyway
  - Bundle size becomes critical issue

### Action Items
1. Close TECH-002 ticket as "Won't Do"
2. Set reminder to re-evaluate in 6 months
3. Monitor for security advisories on v2.1.3
4. Document this decision in ADR (Architecture Decision Record)

## Impact on Other Tech Debt
- **TECH-001 (AppDriver Refactoring)**: Can proceed independently
- No blocking dependencies on react-chessboard version