# BRÜCKENBAU-TRAINER Implementation Tasks

Status: Phase P1 & P2 ✅ Complete | Phase P3 🚧 In Progress | Phase P4 📅 Future

## 🚧 Phase P3: UI Integration Tasks (CURRENT SPRINT)

### Task 1: Enhance MovePanel Component
**File**: `shared/components/training/MovePanel.tsx`

```typescript
// Required changes:
1. Import enhanced types:
   import { EnhancedEvaluationDisplay } from '@shared/types/evaluation';

2. Update props interface:
   interface MovePanelProps {
     evaluation?: EvaluationDisplay | EnhancedEvaluationDisplay;
     // ... existing props
   }

3. Add type guard:
   const isEnhanced = (eval: any): eval is EnhancedEvaluationDisplay => {
     return eval && 'moveQuality' in eval;
   };

4. Render enhanced display:
   {isEnhanced(evaluation) && (
     <>
       <span className={`quality-badge ${evaluation.moveQuality}`}>
         {qualityIcons[evaluation.moveQuality]}
       </span>
       {evaluation.robustness && (
         <span className={`robustness-tag ${evaluation.robustness}`}>
           {evaluation.robustness}
         </span>
       )}
     </>
   )}
```

### Task 2: Create Enhanced Evaluation Styles
**File**: `styles/evaluation-enhanced.css` (NEW)

```css
/* Quality Badges */
.quality-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-left: 0.5rem;
}

.quality-badge.optimal {
  background-color: #22c55e;
  color: white;
}

.quality-badge.sicher {
  background-color: #3b82f6;
  color: white;
}

.quality-badge.umweg {
  background-color: #eab308;
  color: #1f2937;
}

.quality-badge.riskant {
  background-color: #f97316;
  color: white;
}

/* Robustness Tags */
.robustness-tag {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  margin-left: 0.25rem;
  opacity: 0.8;
}

.robustness-tag.robust {
  background-color: #e0f2fe;
  color: #0369a1;
}

.robustness-tag.präzise {
  background-color: #fef3c7;
  color: #92400e;
}

.robustness-tag.haarig {
  background-color: #fee2e2;
  color: #991b1b;
}
```

### Task 3: Create Evaluation Tooltip Component
**File**: `shared/components/ui/EvaluationTooltip.tsx` (NEW)

```typescript
import React from 'react';
import { QUALITY_EDUCATIONAL_CONTENT, ROBUSTNESS_INFO } from '@shared/constants/evaluation';

interface EvaluationTooltipProps {
  quality?: string;
  robustness?: string;
  dtmDiff?: number;
  children: React.ReactNode;
}

export const EvaluationTooltip: React.FC<EvaluationTooltipProps> = ({
  quality,
  robustness,
  dtmDiff,
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const content = quality && QUALITY_EDUCATIONAL_CONTENT[quality];
  const robustnessText = robustness && ROBUSTNESS_INFO[robustness];
  
  if (!content && !robustnessText) return <>{children}</>;
  
  return (
    <div className="tooltip-container">
      <div 
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onTouchStart={() => setIsVisible(!isVisible)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div className="tooltip-content">
          {content && (
            <>
              <div className="tooltip-tip">{content.tip}</div>
              <div className="tooltip-principle">
                Prinzip: {content.principle}
              </div>
              {dtmDiff !== undefined && (
                <div className="tooltip-dtm">
                  ΔDTM: {dtmDiff > 0 ? '+' : ''}{dtmDiff}
                </div>
              )}
            </>
          )}
          {robustnessText && (
            <div className="tooltip-robustness">{robustnessText}</div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Task 4: Update Evaluation Legend
**File**: `shared/components/training/EvaluationLegend.tsx`

Add new sections:
```typescript
// Add to existing legend items:
const enhancedLegendItems = [
  { symbol: '🟢', text: 'Optimal - Kürzester Weg', className: 'optimal' },
  { symbol: '✅', text: 'Sicher - Zuverlässige Technik', className: 'sicher' },
  { symbol: '🟡', text: 'Umweg - Dauert länger', className: 'umweg' },
  { symbol: '⚠️', text: 'Riskant - Gewinn fragil', className: 'riskant' },
];

const robustnessItems = [
  { tag: 'robust', text: 'Viele gute Alternativen' },
  { tag: 'präzise', text: 'Wenige gute Optionen' },
  { tag: 'haarig', text: 'Nur dieser Zug gewinnt' },
];
```

### Task 5: Integration Testing
**Files to test**:
- [ ] Test with position ID 1 (Brückenbau 1/5)
- [ ] Verify enhanced evaluation appears
- [ ] Check tooltip functionality
- [ ] Test mobile touch interactions
- [ ] Verify performance < 100ms

## 📊 Acceptance Criteria

1. **Visual Requirements**:
   - Quality badges clearly visible next to move evaluation
   - Robustness tags appear when applicable
   - Colors match design specification
   - Mobile-responsive layout

2. **Functionality**:
   - Enhanced evaluation only shows for tablebase positions
   - Tooltips show educational content
   - Legend updated with new symbols
   - Backward compatibility maintained

3. **Performance**:
   - No performance regression
   - Evaluation updates within 100ms
   - Smooth UI transitions

4. **Testing**:
   - Unit tests for type guards
   - Integration tests for UI components
   - E2E test for complete flow

## 🔍 Where to Find Things

- **Enhanced Types**: `shared/types/evaluation.ts`
- **Evaluation Logic**: `shared/utils/chess/evaluation/enhanced.ts`
- **Constants**: `shared/constants/evaluation.ts`
- **Current MovePanel**: `shared/components/training/MovePanel.tsx`
- **Test Data**: Use position ID 1-6 (Brückenbau positions)

## ⚡ Quick Start Commands

```bash
# Start dev server
npm run dev

# Navigate to Brückenbau position
http://localhost:3000/train/1

# Run relevant tests
npm test -- MovePanel
npm test -- evaluation

# Check type coverage
npm run tsc
```

## 🎯 Definition of Done

- [ ] All UI components implemented
- [ ] Styles applied and responsive
- [ ] Tooltips functional on desktop/mobile
- [ ] Legend updated
- [ ] Tests passing
- [ ] No TypeScript errors
- [ ] Performance benchmarks met
- [ ] Code reviewed
- [ ] Documentation updated