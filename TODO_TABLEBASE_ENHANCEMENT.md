# TODO: Tablebase Display Enhancement

## 🎯 Project Goal
Transform the basic tablebase display into a polished, Lichess-like experience with color-coded moves, visual evaluation bars, and better information hierarchy.

## 🌿 Worktree Setup
**This is a Git worktree - separate environment setup required:**

```bash
# Install dependencies (worktree has no node_modules)
npm install

# Start development server on port 3009 (avoid conflicts)
npm run dev -- -p 3009
```

**Server URL:** http://localhost:3009

**Note:** This worktree is independent of the main branch - all changes stay isolated until merge.

## 🔍 Current State vs Target

### Current Display:
```
📚 Tablebase
Kf6 - DTZ 2
Kd6 - DTZ 2  
Kf5 - DTZ 0
```

### Target (Lichess-like):
- **Color-coded moves**: Green (Win), Yellow (Draw), Red (Loss)
- **Visual evaluation bars** behind moves
- **Grouped by result type**: Winning moves, Drawing moves, Losing moves
- **Unified layout** instead of separate Engine/Tablebase columns
- **Better typography** and spacing
- **Clear status indicators** with icons

## 📋 Task Breakdown

### Phase 1: Core Components (High Priority)

#### ✅ Analysis & Research
- [x] Analyze current tablebase display implementation
- [x] Research Lichess tablebase UI design with Gemini
- [x] Get design recommendations from O3

#### 🔧 Component Creation
- [ ] **Create MoveEvaluationBar component**
  - Visual progress bar with color coding
  - Maps DTZ values to bar width and color
  - Accessible with both visual and text indicators
  - File: `shared/components/tablebase/MoveEvaluationBar.tsx`

- [ ] **Create MoveResultGroup component**
  - Groups moves by result type (Win/Draw/Loss)
  - Collapsible sections with clear headings
  - Consistent spacing and typography
  - File: `shared/components/tablebase/MoveResultGroup.tsx`

- [ ] **Create TablebasePanel component**
  - Unified layout replacing two-column approach
  - Prioritizes tablebase moves over engine moves
  - Integrates both evaluation types seamlessly
  - File: `shared/components/tablebase/TablebasePanel.tsx`

- [ ] **Refactor DualEvaluationPanel**
  - Integrate new tablebase components
  - Maintain backward compatibility
  - Update props and interfaces
  - File: `shared/components/training/DualEvaluationPanel/index.tsx`

### Phase 2: Logic & Utilities (Medium Priority)

- [ ] **Create result classification utilities**
  - Functions to categorize moves by DTZ values
  - Win/Draw/Loss determination logic
  - DTZ value interpretation
  - File: `shared/utils/tablebase/resultClassification.ts`

- [ ] **Implement color coding system**
  - Green: Winning moves (DTZ > 0)
  - Yellow: Drawing moves (DTZ = 0)
  - Red: Losing moves (DTZ < 0)
  - CSS classes and Tailwind utilities

### Phase 3: Testing & Polish (Low Priority)

- [ ] **Test with various endgame positions**
  - Test King + Pawn vs King positions
  - Test complex endgame scenarios
  - Verify DTZ value handling
  - Edge case testing

- [ ] **Polish typography and spacing**
  - Lichess-like font weights and sizes
  - Consistent spacing and alignment
  - Responsive design considerations
  - Dark mode compatibility

## 🏗️ Technical Implementation Details

### Color Coding Logic:
```typescript
const getMoveResultType = (dtz: number): 'win' | 'draw' | 'loss' => {
  if (dtz > 0) return 'win';
  if (dtz === 0) return 'draw';
  return 'loss';
};

const getColorClass = (resultType: string): string => {
  switch (resultType) {
    case 'win': return 'bg-green-500';
    case 'draw': return 'bg-yellow-500';
    case 'loss': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};
```

### Component Architecture:
```
TablebasePanel
├── MoveResultGroup (Winning)
│   ├── MoveEvaluationBar
│   └── Move details
├── MoveResultGroup (Drawing)
│   ├── MoveEvaluationBar
│   └── Move details
└── MoveResultGroup (Losing)
    ├── MoveEvaluationBar
    └── Move details
```

## 📁 Files to Create/Modify

### New Files:
- `shared/components/tablebase/MoveEvaluationBar.tsx`
- `shared/components/tablebase/MoveResultGroup.tsx`
- `shared/components/tablebase/TablebasePanel.tsx`
- `shared/utils/tablebase/resultClassification.ts`

### Modified Files:
- `shared/components/training/DualEvaluationPanel/index.tsx`

### Test Files:
- `tests/unit/components/tablebase/MoveEvaluationBar.test.tsx`
- `tests/unit/components/tablebase/MoveResultGroup.test.tsx`
- `tests/unit/components/tablebase/TablebasePanel.test.tsx`
- `tests/unit/utils/tablebase/resultClassification.test.ts`

## 🚀 Expected Outcome

A professional, Lichess-like tablebase display featuring:
- ✅ Clear visual distinction between move types
- ✅ Intuitive color coding and evaluation bars
- ✅ Better information density and readability
- ✅ Maintainable, extensible component architecture
- ✅ Enhanced user experience for endgame training

## 📝 Implementation Notes

1. **Prioritize tablebase moves** - They are more definitive than engine evaluations
2. **Maintain accessibility** - Use color + text + icons for all indicators
3. **Keep components pure** - Separate presentation from business logic
4. **Test thoroughly** - Verify with various endgame positions
5. **Follow existing patterns** - Use established project conventions

---

*This file can be deleted once the enhancement is complete and merged.*