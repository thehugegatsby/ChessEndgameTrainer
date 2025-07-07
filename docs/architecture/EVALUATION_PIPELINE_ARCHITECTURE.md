# Evaluation Pipeline Architecture

## Overview

This document describes the architecture of the chess evaluation pipeline and the reasoning behind the design decisions, particularly regarding perspective handling and value normalization.

## The Problem

In chess engines, evaluation scores are typically given from the perspective of the player to move. However, in a UI, we want to display scores from a chosen perspective (either White or Black). This led to a "double inversion" problem where values were being inverted twice when Black was to move AND the display perspective was Black.

## The Solution: Clear Separation of Concerns

After consulting with multiple AI models and analyzing different approaches, we implemented a clean pipeline with clearly defined responsibilities:

```
Raw Engine Data → Normalizer → PerspectiveTransformer → Formatter → UI
```

### Component Responsibilities

#### 1. Normalizer
- **Single Responsibility**: Convert all evaluations to White's perspective
- **Input**: Raw engine/tablebase data + player to move
- **Output**: `NormalizedEvaluation` (ALWAYS from White's perspective)
- **Key Logic**: If Black is to move, multiply by -1 to convert to White's perspective

```typescript
// Example: Engine gives +50 for Black (Black's advantage)
normalize(score: 50, playerToMove: 'b') → { scoreInCentipawns: -50 }
// Result: -50 from White's perspective (Black advantage = negative for White)
```

#### 2. PerspectiveTransformer
- **Single Responsibility**: Transform normalized values to display perspective
- **Input**: `NormalizedEvaluation` (White's perspective) + desired display perspective
- **Output**: `PlayerPerspectiveEvaluation` with perspective-adjusted values
- **Key Logic**: If display perspective is Black, multiply by -1

```typescript
// Example: Normalized score is -50 (Black advantage from White's view)
transform({ score: -50 }, perspective: 'b') → { perspectiveScore: 50 }
// Result: +50 from Black's perspective (their advantage)
```

#### 3. Formatter
- **Single Responsibility**: Format evaluation for UI display
- **Input**: `PlayerPerspectiveEvaluation`
- **Output**: `FormattedEvaluation` with display strings and CSS classes
- **No perspective logic**: Just formatting

## The "Double Inversion" Explained

The double inversion is **intentional and mathematically correct**:

### Example: Black to move, display from Black's perspective
1. Engine reports: `+50` (advantage for Black, who is to move)
2. Normalizer: `+50 × -1 = -50` (convert to White's perspective)
3. PerspectiveTransformer: `-50 × -1 = +50` (convert to Black's display perspective)
4. Final display: `+50` (Black sees their advantage as positive)

This is correct! The value goes through two inversions but ends up showing Black's advantage as positive when viewing from Black's perspective.

## Alternative Approaches Considered

### 1. Unified Adapter
Combine normalization and perspective transformation in one step.
- **Pros**: No double inversion, simpler logic
- **Cons**: Less modular, harder to test, violates Single Responsibility Principle

### 2. Context Object
Pass evaluation context through pipeline with flags.
- **Pros**: Flexible, prevents accidental double transformation
- **Cons**: More complex, larger data structures

### 3. Configuration-Driven
Normalizer doesn't invert, final UI layer handles all perspective logic.
- **Pros**: Clear separation of internal vs display logic
- **Cons**: Pushes complexity to UI layer

## Why We Chose This Architecture

1. **Clarity**: Each component has one clear job
2. **Testability**: Components can be tested in isolation
3. **Maintainability**: New developers can understand the flow
4. **Extensibility**: Easy to add new transformations
5. **Type Safety**: Strong contracts between components

## Implementation Guidelines

### Data Flow Guarantees
- After Normalizer: Values are ALWAYS from White's perspective
- After PerspectiveTransformer: Values match the requested display perspective
- Formatter receives pre-transformed values and only formats

### Type Contracts
```typescript
// Normalizer output
interface NormalizedEvaluation {
  scoreInCentipawns: number; // ALWAYS from White's perspective
  // ... other fields
}

// Transformer output  
interface PlayerPerspectiveEvaluation {
  perspective: 'w' | 'b'; // The perspective these values represent
  perspectiveScore: number; // Score from the specified perspective
  // ... other fields
}
```

### Testing Strategy
1. Test Normalizer with various inputs, verify always outputs White's perspective
2. Test PerspectiveTransformer independently with known inputs
3. Test full pipeline integration with edge cases

## Common Pitfalls to Avoid

1. **Don't skip normalization**: Even if White is to move, pass through normalizer for consistency
2. **Don't add perspective logic to formatter**: It should only format pre-transformed values
3. **Document perspective at each stage**: Make it clear what perspective values represent

## Future Considerations

- If we add more evaluation sources (e.g., neural networks), they should go through the same pipeline
- Consider caching at the normalized stage (White's perspective) for efficiency
- The pipeline could be extended with additional transformers (e.g., for different rating systems)

---
*Last Updated: 2025-01-07*  
*Architecture Decision Record*