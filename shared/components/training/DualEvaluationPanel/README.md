# DualEvaluationPanel

**Purpose**: Displays side-by-side Stockfish engine and Syzygy tablebase evaluations with comparison analysis.

## Component Structure

### Main Container (`index.tsx`)
```
DualEvaluationPanel
├── EngineErrorBoundary
└── Grid Layout
    ├── EngineEvaluationCard
    ├── TablebaseEvaluationCard
    └── EvaluationComparison
```

### Sub-Components

#### `EngineEvaluationCard`
- **Input**: `evaluation: DualEvaluation['engine']`
- **Shows**: Score, mate-in-X, UCI protocol status
- **Features**: Loading states, color-coded evaluation

#### `TablebaseEvaluationCard` 
- **Input**: `evaluation: DualEvaluation['tablebase']`
- **Shows**: WDL, DTZ, category (win/loss/draw)
- **Fallback**: "Not available" for >7 pieces

#### `EvaluationComparison`
- **Input**: `evaluation: DualEvaluation`
- **Shows**: Agreement status, confidence level
- **Logic**: Compares engine vs tablebase results

## Data Flow

```
FEN → useEngine → ScenarioEngine → getDualEvaluation()
                                 ├── Engine: score, mate
                                 └── Tablebase: wdl, dtz, category
                                     ↓
                                 Comparison Analysis
```

## Usage

```typescript
<DualEvaluationPanel 
  fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  onEvaluationUpdate={(eval) => console.log(eval)}
  isVisible={true}
/>
```

## Error Handling
- **EngineErrorBoundary**: Catches engine crashes
- **Fallback UI**: Shows helpful error messages
- **Auto-recovery**: Engine restarts automatically

## Performance
- **Managed Engine**: Uses EngineService for resource pooling
- **Position Updates**: Updates engine position before evaluation
- **Loading States**: Unified loading for engine + tablebase