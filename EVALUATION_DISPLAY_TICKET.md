# Ticket: [EVALUATION-DISPLAY] - Display Stockfish Evaluation Scores Next to Moves

## Summary
Implement the display of Stockfish evaluation scores next to each move in the move list UI.

## Background
The Bridge-Building E2E tests were originally written to verify evaluation displays, but this feature is not yet implemented. The tests have been temporarily modified to only check move sequences.

## Requirements
1. Parse UCI `info score` messages from Stockfish engine
2. Store evaluation scores in the application state
3. Display evaluation scores as `span.text-xs` elements next to each move
4. Support different evaluation indicators:
   - Normal moves: numerical score (e.g., +0.5, -1.2)
   - Mistakes: 🔻 with appropriate styling
   - Blunders: ❌ with appropriate styling  
   - Inaccuracies: ⚠️ with appropriate styling

## Technical Details
- The engine already sends evaluation info via UCI protocol
- Need to parse messages like: `info depth 20 score cp 21 nodes 1234567`
- Convert centipawns to display format (cp/100)
- Associate evaluations with specific moves in the move history

## Affected Files
- `/shared/lib/chess/engine.ts` - Parse UCI info messages
- `/shared/components/training/TrainingBoard/TrainingBoardZustand.tsx` - Store evaluations
- `/shared/components/training/MoveList.tsx` (or similar) - Display evaluations

## Test Coverage
Re-enable the commented-out test assertions in:
- `/tests/e2e/bridge-building.spec.ts`

Look for TODO comments marked with [EVALUATION-DISPLAY].

## Acceptance Criteria
- [ ] Evaluation scores appear next to each move
- [ ] Mistakes/blunders/inaccuracies show appropriate symbols
- [ ] Bridge-Building E2E tests pass with evaluation checks enabled
- [ ] Performance: Evaluations don't slow down move input

## Priority
Medium - Core functionality works without this, but it enhances user experience significantly.