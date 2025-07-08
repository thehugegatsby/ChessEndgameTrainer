# Firestore Migration Plan

## Overview
Migration of chess endgame positions from TypeScript arrays to Firebase Firestore to enable scalability and user progress tracking.

## Timeline
- **Phase 1**: Schema Design & Setup (Week 1)
- **Phase 2**: Migration Implementation (Week 2-3)
- **Phase 3**: Testing Strategy (Week 4)
- **Phase 4**: Cutover & Monitoring (Week 5)

## Firestore Schema Design

### Collections Structure

#### 1. `positions` Collection
Primary collection for all chess endgame positions.

```typescript
positions/{positionId}
{
  // Core fields
  id: number,
  title: string,
  description: string,
  fen: string,
  category: "pawn" | "rook" | "queen" | "bishop" | "knight" | "mixed",
  difficulty: "beginner" | "intermediate" | "advanced",
  goal: "win" | "draw" | "defend",
  sideToMove: "w" | "b",
  
  // Material tracking
  materialWhite: string,  // e.g., "K+P"
  materialBlack: string,  // e.g., "K"
  
  // Educational content
  baseContent: {
    strategies: string[],
    commonMistakes: string[],
    keyPrinciples: string[]
  },
  
  // Position-specific content
  specialContent: {
    keySquares: string[],
    criticalMoves: string[],
    specificTips: string[]
  },
  
  // Bridge building specific (optional)
  bridgeHints?: string[],
  
  // Metadata
  tags: string[],
  prerequisites: number[],  // IDs of prerequisite positions
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // Optional fields
  historicalNote?: string,
  estimatedDifficulty?: number,  // 1-10 scale
  studyTime?: number  // in minutes
}
```

#### 2. `users/{userId}/progress` Subcollection
Track individual user progress for each position.

```typescript
users/{userId}/progress/{positionId}
{
  // Performance metrics
  timesPlayed: number,
  successRate: number,  // 0-100
  lastPlayed: timestamp,
  averageTime: number,  // seconds
  
  // Spaced repetition data
  rating: number,  // ELO-style rating
  interval: number,  // days until next review
  easeFactor: number,  // difficulty multiplier
  nextReview: timestamp,
  
  // Training data
  bestMoves: string[],  // best moves found by user
  mistakes: string[],   // common mistakes made
  needsReview: boolean,
  
  // Metadata
  firstPlayed: timestamp,
  lastModified: timestamp
}
```

#### 3. `categories` Collection
Metadata for endgame categories.

```typescript
categories/{categoryId}
{
  id: "pawn" | "rook" | "queen" | "bishop" | "knight" | "mixed",
  name: string,
  description: string,
  icon: string,
  color: string,
  mobilePriority: number,
  estimatedStudyTime: string,
  skillLevel: string,
  positionCount: number,
  isAvailableOffline: boolean
}
```

#### 4. `chapters` Collection
Thematic groupings of positions (e.g., "Brückenbau").

```typescript
chapters/{chapterId}
{
  id: string,
  name: string,
  description: string,
  category: string,  // reference to category
  lessons: number[],  // ordered array of position IDs
  totalLessons: number,
  difficulty: string,
  prerequisites: string[],  // chapter IDs
  createdAt: timestamp
}
```

## Migration Strategy

### Phase 1: Setup & Preparation
1. Enable Firestore in Firebase Console
2. Set up security rules
3. Create composite indexes for common queries
4. Set up development and staging environments

### Phase 2: Implementation

#### Step 1: Create Migration Service
```typescript
// shared/services/database/migrationService.ts
import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import { allEndgamePositions } from '@shared/data/endgames';

export class FirestoreMigrationService {
  async migratePositions(): Promise<void> {
    const batch = writeBatch(db);
    
    for (const position of allEndgamePositions) {
      const docRef = doc(collection(db, 'positions'), position.id.toString());
      
      batch.set(docRef, {
        ...position,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
    
    await batch.commit();
    console.log(`Successfully migrated ${allEndgamePositions.length} positions`);
  }
  
  async migrateCategories(): Promise<void> {
    // Migrate category metadata
  }
  
  async migrateChapters(): Promise<void> {
    // Migrate chapter data
  }
}
```

#### Step 2: Implement Dual-Read Pattern
```typescript
// shared/services/database/positionService.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import { getPositionById as getPositionFromArray } from '@shared/data/endgames';

export class PositionService {
  private useFirestore = process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true';
  
  async getPosition(id: number): Promise<EndgamePosition | null> {
    if (!this.useFirestore) {
      return getPositionFromArray(id);
    }
    
    try {
      const docRef = doc(db, 'positions', id.toString());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as EndgamePosition;
      }
      
      // Fallback to array if not found
      console.warn(`Position ${id} not found in Firestore, falling back to array`);
      return getPositionFromArray(id);
    } catch (error) {
      console.error('Firestore read error:', error);
      // Fallback on error
      return getPositionFromArray(id);
    }
  }
  
  async getAllPositions(): Promise<EndgamePosition[]> {
    // Implementation for fetching all positions
  }
}
```

### Phase 3: Testing Strategy

#### Unit Tests
```typescript
// tests/unit/services/migrationService.test.ts
describe('FirestoreMigrationService', () => {
  let migrationService: FirestoreMigrationService;
  
  beforeEach(() => {
    migrationService = new FirestoreMigrationService();
  });
  
  test('should migrate all positions to Firestore', async () => {
    await migrationService.migratePositions();
    
    // Verify each position exists in Firestore
    for (const position of allEndgamePositions) {
      const doc = await getDoc(doc(db, 'positions', position.id.toString()));
      expect(doc.exists()).toBe(true);
      expect(doc.data()).toMatchObject(position);
    }
  });
});
```

#### Integration Tests
```typescript
// tests/integration/dualReadPattern.test.ts
describe('Dual-Read Pattern', () => {
  test('reads from Firestore when enabled', async () => {
    process.env.NEXT_PUBLIC_USE_FIRESTORE = 'true';
    const service = new PositionService();
    
    const position = await service.getPosition(1);
    expect(position).toBeDefined();
    // Verify it came from Firestore
  });
  
  test('falls back to array on Firestore error', async () => {
    // Mock Firestore to throw error
    jest.spyOn(firestore, 'getDoc').mockRejectedValue(new Error('Network error'));
    
    const position = await service.getPosition(1);
    expect(position).toBeDefined();
    expect(position?.id).toBe(1);
  });
});
```

### Phase 4: Rollout Plan

1. **Development Environment**
   - Run migration script
   - Test all features with Firestore
   - Verify performance metrics

2. **Staging Environment**
   - Mirror production data
   - Run full test suite
   - Performance testing with 1000+ positions

3. **Production Rollout**
   - Enable dual-read with Firestore disabled
   - Run migration script
   - Enable Firestore for 10% of users
   - Monitor for 24 hours
   - Gradual rollout to 100%

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Positions are read-only for all users
    match /positions/{position} {
      allow read: if true;
      allow write: if false;
    }
    
    // Users can only access their own progress
    match /users/{userId}/progress/{position} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Categories and chapters are public read
    match /categories/{category} {
      allow read: if true;
      allow write: if false;
    }
    
    match /chapters/{chapter} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## Monitoring & Alerts

1. **Performance Monitoring**
   - Set up Firebase Performance Monitoring
   - Track Firestore read/write latency
   - Monitor cold start times

2. **Cost Monitoring**
   - Set up billing alerts at $10, $50, $100
   - Monitor daily read/write operations
   - Track storage growth

3. **Error Tracking**
   - Log all Firestore errors to Sentry
   - Set up alerts for high error rates
   - Monitor fallback usage

## Backup & Recovery

1. **Pre-Migration Backup**
   ```bash
   # Export current TypeScript data to JSON
   npm run export:positions
   ```

2. **Firestore Backups**
   - Enable daily automatic backups
   - Store backups in Cloud Storage
   - Test restore process monthly

3. **Rollback Plan**
   - Keep dual-read pattern for 2 weeks
   - One-click feature flag to disable Firestore
   - Maintain TypeScript arrays until fully validated

## Success Criteria

- [ ] All 16 positions migrated successfully
- [ ] Zero data loss during migration
- [ ] Page load time < 2 seconds
- [ ] 100% test coverage for migration code
- [ ] User progress persists across sessions
- [ ] No increase in error rate
- [ ] Cost remains under $50/month for 1000 users

## Next Steps

1. Review and approve migration plan
2. Set up Firestore development environment
3. Implement migration service
4. Write comprehensive test suite
5. Begin phased rollout