# MoveQualityEvaluator Module

## Purpose

Provides comprehensive move quality assessment using tablebase analysis to determine if a player's move was optimal and whether to show educational feedback.

## Core Concepts

### WDL (Win/Draw/Loss) Evaluation

- **Win**: Positive outcome for the player
- **Draw**: Neutral outcome
- **Loss**: Negative outcome for the player

### DTM (Distance to Mate)

- Measures moves until forced checkmate
- Lower values indicate faster wins
- Used for comparing moves with same outcome

## Evaluation Process

### 1. Parallel Position Evaluation

```typescript
const [evalBefore, evalAfter] = await Promise.all([
  getEvaluation(fenBefore),
  getEvaluation(fenAfter),
]);
```

### 2. Perspective Conversion

Converts WDL values to player's perspective:

- Black's turn: Negate WDL values
- White's turn: Keep WDL values as-is

### 3. Baseline Determination

Uses training baseline or current position:

- Training baseline: Reference position for comparison
- Current position: When no baseline available

### 4. Move Comparison

Compares played move against top tablebase moves:

- Fetches top 3 moves for comparison
- Checks if played move matches best move
- Evaluates outcome changes

## Decision Logic

### When to Show Error Dialog

The evaluator shows an error dialog when:

1. Move was not optimal (not in top moves)
2. Outcome significantly worsened:
   - Win → Draw/Loss
   - Draw → Loss

### When to Skip Evaluation

Evaluation is skipped when:

- Tablebase data unavailable
- Position has too many pieces (>7)
- Network errors occur

## Key Methods

### evaluateMoveQuality()

Main entry point for move evaluation.

**Parameters:**

- `fenBefore`: Position before move
- `fenAfter`: Position after move
- `validatedMove`: The move that was played
- `trainingBaseline`: Optional reference position

**Returns:**

- `shouldShowErrorDialog`: Whether to show feedback
- `wdlBefore/After`: WDL values for analysis
- `bestMove`: Optimal move if different
- `wasOptimal`: Whether move was best
- `outcomeChanged`: Whether outcome worsened

### Helper Methods

#### areEvaluationsValid()

Validates that both positions have tablebase data.

#### convertToPlayerPerspective()

Adjusts WDL values based on whose turn it is.

#### determineEffectiveBaseline()

Selects appropriate baseline for comparison.

#### wasMoveBest()

Checks if played move matches tablebase recommendation.

#### didOutcomeChange()

Detects significant outcome deterioration.

## Performance Optimizations

### Parallel API Calls

Fetches before/after evaluations simultaneously.

### Early Termination

Skips evaluation if data unavailable.

### Caching

Leverages TablebaseService's LRU cache.

## Configuration

### Constants

- `TOP_MOVES_LIMIT`: 3 (moves to compare)

### Thresholds

- Win threshold: WDL > 0
- Loss threshold: WDL < 0
- Draw: WDL = 0

## Integration Points

### TablebaseService

- Fetches position evaluations
- Retrieves top moves

### Training State

- Uses baseline positions
- Updates move quality statistics

### Dialog System

- Triggers error dialogs
- Provides move feedback

## Testing Strategies

### Unit Tests

- Mock tablebase responses
- Test perspective conversion
- Verify decision logic

### Integration Tests

- Real tablebase API calls
- Full evaluation flow
- Dialog triggering

## Common Scenarios

### Scenario: Perfect Play

- Player makes optimal move
- No dialog shown
- Statistics updated positively

### Scenario: Blunder

- Player makes losing move
- Error dialog shown
- Best move suggested

### Scenario: Suboptimal but Acceptable

- Move maintains outcome
- No dialog (configurable)
- Statistics note suboptimality
