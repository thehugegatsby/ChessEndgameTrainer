# Current Development Focus

## 🎯 Active Issues (Priority Order)

### High Priority Bugs

These issues block user experience and should be fixed first:

1. **#15: Tablebase evaluation emojis missing**
   - Symptom: Move quality indicators (✓, ⚡, etc.) not displaying
   - Location: Move list component or evaluation formatting
   - Impact: Users can't see move quality at a glance

2. **#16: Wrong Brückenbau titles**
   - Symptom: Shows full description instead of "Brückenbau X/Y" format
   - Location: Position title formatting in data or display
   - Impact: Confusing UI for training positions

3. **#20: Missing Firestore positions 9-11**
   - Symptom: Some positions fail to load from database
   - Location: Position service or data seeding
   - Impact: Incomplete training content

## 🔄 Recent Architecture Changes

### Clean Cut Migration (Just Completed)

All references to "engine" have been renamed to "tablebase":

- `requestEngineMove` → `requestTablebaseMove`
- `isEngineThinking` → removed (use `analysisStatus === 'loading'`)
- `engineStatus` → `analysisStatus`
- `ErrorType.CHESS_ENGINE` → `ErrorType.TABLEBASE`

### State Simplification

- Removed redundant `isAnalyzing` field
- `analysisStatus` now handles all states: `idle | loading | success | error`
- `tablebaseMove` uses `string | null | undefined` pattern

## 📍 Where to Find Current Issues

The single source of truth for all issues is GitHub Issues:

- **Bug Reports**: https://github.com/[org]/[repo]/issues?q=is:issue+is:open+label:bug
- **Feature Requests**: https://github.com/[org]/[repo]/issues?q=is:issue+is:open+label:enhancement

## 🐛 Common Problem Patterns

When debugging, pay special attention to:

1. **Tablebase API Errors**
   - Rate limiting from Lichess API
   - Invalid FEN strings causing API rejections
   - Network timeouts (7 second timeout configured)

2. **State Synchronization**
   - Store updates not triggering re-renders
   - Race conditions between user moves and tablebase responses
   - Stale closures in event handlers

3. **Component Rendering**
   - Missing data in move display components
   - Conditional rendering based on wrong state fields
   - Props not properly passed down component tree

## 🧪 Testing Focus Areas

When fixing bugs, ensure tests cover:

- Tablebase API error scenarios
- State transitions during move execution
- Component rendering with various data states
- FEN validation edge cases

## 📝 Definition of Done

A bug is considered fixed when:

1. Root cause identified and fixed
2. Unit tests added/updated
3. Manual testing confirms fix
4. No regression in existing functionality
5. Code follows naming conventions (no "engine" references)
