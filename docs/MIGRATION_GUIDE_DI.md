# Migration Guide: Firebase Dependency Injection

## Overview

This guide describes the migration from the singleton `positionService` to the new dependency injection architecture using the Repository pattern.

## Architecture Changes

### Before (Singleton Pattern)
```typescript
// Old: Direct singleton import
import { positionService } from '@shared/services/database/positionService';

// Old: Direct Firebase coupling
export class PositionService {
  async getPosition(id: number) {
    const docRef = doc(db, 'positions', id.toString());
    // ...
  }
}

// Old: Untestable due to Firebase coupling
export const positionService = new PositionService();
```

### After (Dependency Injection)
```typescript
// New: Repository pattern with DI
import { usePositionService } from '@shared/contexts/PositionServiceContext';

// New: Complete abstraction
export class PositionService {
  constructor(private repository: IPositionRepository) {}
  
  async getPosition(id: number) {
    return this.repository.getPosition(id);
  }
}

// New: Fully testable with mock repositories
const service = new PositionService(mockRepository);
```

## Migration Steps

### 1. Update _app.tsx

```typescript
// pages/_app.tsx
import { PositionServiceProvider } from '@shared/contexts/PositionServiceContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PositionServiceProvider>
      {/* Other providers */}
      <Component {...pageProps} />
    </PositionServiceProvider>
  );
}
```

### 2. Update Components

#### Before
```typescript
// components/MyComponent.tsx
import { positionService } from '@shared/services/database/positionService';

export const MyComponent = () => {
  useEffect(() => {
    const loadData = async () => {
      const position = await positionService.getPosition(1);
      // ...
    };
    loadData();
  }, []);
};
```

#### After
```typescript
// components/MyComponent.tsx
import { usePositionService } from '@shared/contexts/PositionServiceContext';

export const MyComponent = () => {
  const positionService = usePositionService();
  
  useEffect(() => {
    const loadData = async () => {
      const position = await positionService.getPosition(1);
      // ...
    };
    loadData();
  }, [positionService]);
};
```

### 3. Update Pages

#### Static Generation (getStaticProps)
```typescript
// pages/train/[id].tsx
import { FirebasePositionRepository } from '@shared/repositories/implementations/FirebasePositionRepository';
import { PositionService } from '@shared/services/database/PositionService';
import { db } from '@shared/lib/firebase';

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // Create repository and service for server-side
  const repository = new FirebasePositionRepository(db);
  const positionService = new PositionService(repository);
  
  const position = await positionService.getPosition(Number(params.id));
  
  return {
    props: { position },
    revalidate: 3600 // ISR
  };
};
```

### 4. Update Store

```typescript
// store/store.ts
// Remove direct import
// import { positionService } from '@shared/services/database/positionService';

// Add service as parameter to actions
const loadTrainingContext = async (positionId: number, positionService: PositionService) => {
  const position = await positionService.getPosition(positionId);
  // ...
};

// In components using store
const positionService = usePositionService();
await store.loadTrainingContext(1, positionService);
```

### 5. Update Tests

#### Unit Tests
```typescript
// tests/unit/services/PositionService.test.ts
import { PositionService } from '@shared/services/database/PositionService';
import { MockPositionRepository } from '@shared/repositories/implementations/MockPositionRepository';

describe('PositionService', () => {
  let service: PositionService;
  let mockRepository: MockPositionRepository;
  
  beforeEach(() => {
    mockRepository = new MockPositionRepository();
    service = new PositionService(mockRepository);
  });
  
  test('should get position from repository', async () => {
    const testPosition = { id: 1, title: 'Test', /* ... */ };
    mockRepository.seedData({ positions: [testPosition] });
    
    const result = await service.getPosition(1);
    expect(result).toEqual(testPosition);
  });
});
```

#### Component Tests
```typescript
// tests/components/Dashboard.test.tsx
import { render } from '@testing-library/react';
import { PositionServiceProvider } from '@shared/contexts/PositionServiceContext';
import { MockPositionRepository } from '@shared/repositories/implementations/MockPositionRepository';
import Dashboard from '@pages/dashboard';

test('renders dashboard with mock data', () => {
  const mockRepository = new MockPositionRepository();
  mockRepository.seedData({ /* test data */ });
  
  render(
    <PositionServiceProvider repository={mockRepository}>
      <Dashboard />
    </PositionServiceProvider>
  );
  
  // assertions...
});
```

## File Changes Summary

### Delete
- `/shared/services/database/positionService.ts` (old singleton)

### Create
- `/shared/repositories/IPositionRepository.ts`
- `/shared/repositories/implementations/FirebasePositionRepository.ts`
- `/shared/repositories/implementations/MockPositionRepository.ts`
- `/shared/services/database/PositionService.ts` (new DI version)
- `/shared/contexts/PositionServiceContext.tsx`
- `/shared/repositories/index.ts`

### Update
- `/pages/_app.tsx` - Add PositionServiceProvider
- `/pages/dashboard.tsx` - Use usePositionService hook
- `/pages/train/[id].tsx` - Update getStaticProps
- `/shared/store/store.ts` - Remove direct import, add parameter
- `/shared/components/navigation/AdvancedEndgameMenu.tsx` - Use hook
- All test files using positionService

## Benefits

1. **Testability**: 100% unit test coverage possible with MockRepository
2. **Flexibility**: Easy to switch between Firebase, API, or local storage
3. **Maintainability**: Clear separation of concerns
4. **Type Safety**: Full TypeScript support with interfaces
5. **Performance**: Built-in caching with configuration options

## Testing the Migration

1. Run existing E2E tests to ensure functionality
2. Create unit tests for PositionService with MockRepository
3. Add component tests with PositionServiceProvider
4. Verify Firebase integration with emulator tests

## Rollback Plan

If issues arise, the migration can be rolled back by:
1. Restoring the old `positionService.ts` file
2. Reverting component changes to use direct imports
3. Removing the new repository and context files

However, given this is a clean break with no production concerns, full migration is recommended.