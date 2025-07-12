# Dependency Injection Architecture

## Overview

This document describes the Dependency Injection (DI) architecture implemented in the ChessEndgameTrainer project. The migration from singleton patterns to DI was completed on 2025-07-12 to improve testability, maintainability, and separation of concerns.

## Architecture Components

### 1. Repository Pattern

The repository pattern abstracts data access, allowing different implementations for different environments.

#### Interfaces

- **`IPositionRepository`** - Core data access interface with 30+ methods
- **`IPositionRepositoryConfig`** - Configuration options for repositories
- **`IPositionRepositoryEvents`** - Event callbacks for monitoring

#### Implementations

- **`FirebasePositionRepository`** - Production implementation using Firestore
- **`MockPositionRepository`** - In-memory implementation for testing

```typescript
// Example usage
const repository = new FirebasePositionRepository(db, {
  enableCache: true,
  cacheSize: 200,
  cacheTTL: 300000
});
```

### 2. Service Layer

The service layer contains business logic and uses repositories for data access.

#### Interfaces

- **`IPositionService`** - Service interface for position-related operations
- **`IPositionServiceConfig`** - Service configuration options

#### Implementation

- **`PositionService`** - Main service implementation with caching

```typescript
// Constructor injection
const service = new PositionService(repository, {
  cacheEnabled: true,
  cacheSize: 200,
  cacheTTL: 300000
});
```

### 3. Dependency Injection Patterns

#### React Components (React Context)

For React components, we use React Context for dependency injection:

```typescript
// In _app.tsx
<PositionServiceProvider>
  <App />
</PositionServiceProvider>

// In components
const positionService = usePositionService();
```

#### Non-React Modules (Service Locator)

For non-React modules like the Zustand store, we use a Service Locator pattern:

```typescript
// Configure once in _app.tsx
configureStore({ positionService });

// Use in store
const { positionService } = getStoreDependencies();
```

#### Server-Side Rendering

For Next.js SSG/SSR, we provide factory functions:

```typescript
// In getStaticProps
const positionService = getServerPositionService();
```

## Migration Guide

### Before (Singleton Pattern)

```typescript
// Old singleton
import { positionService } from '@shared/services/database/positionService';

// Direct usage
const position = await positionService.getPosition(id);
```

### After (Dependency Injection)

```typescript
// React Component
import { usePositionService } from '@shared/contexts/PositionServiceContext';

const MyComponent = () => {
  const positionService = usePositionService();
  // Use service
};

// Non-React Module
import { getStoreDependencies } from '@shared/store/storeConfig';

const { positionService } = getStoreDependencies();

// Server-Side
import { getServerPositionService } from '@shared/services/database';

export const getStaticProps = async () => {
  const positionService = getServerPositionService();
  // Use service
};
```

## Key Benefits

1. **Testability** - Easy to mock dependencies for unit tests
2. **Flexibility** - Switch implementations based on environment
3. **Separation of Concerns** - Clear boundaries between layers
4. **No Circular Dependencies** - Explicit dependency flow
5. **Type Safety** - Full TypeScript support with interfaces

## Implementation Details

### Cache Management

The LRUCache is used internally by PositionService:
- Keys are strings (converted from number IDs)
- TTL support for cache expiration
- Memory-efficient for mobile devices

### Error Handling

Custom error classes provide consistent error handling:
- `PositionError` - Base error class
- `PositionNotFoundError` - When position doesn't exist
- `InvalidPositionError` - For invalid data
- `RepositoryError` - For data access failures

### ID Generation

FirebasePositionRepository uses `nanoid` for unique ID generation:
```typescript
const uniqueId = nanoid();
const id = Math.abs(uniqueId.split('').reduce((a, b) => {
  a = ((a << 5) - a) + b.charCodeAt(0);
  return a & a;
}, 0));
```

## Testing Strategy

### Unit Tests
```typescript
// Use MockPositionRepository
const repository = new MockPositionRepository();
const service = new PositionService(repository);
```

### Integration Tests
```typescript
// Use FirebasePositionRepository with emulator
const repository = new FirebasePositionRepository(emulatorDb);
```

### E2E Tests
```typescript
// Automatic detection in PositionServiceProvider
// Uses MockPositionRepository when NODE_ENV === 'test'
```

## Future Enhancements

1. **Additional Repositories**
   - `APIPositionRepository` - REST API implementation
   - `GraphQLPositionRepository` - GraphQL implementation
   - `LocalStorageRepository` - Offline-first support

2. **Decorator Pattern**
   - Cache as decorator instead of built-in
   - Logging decorator for debugging
   - Metrics decorator for monitoring

3. **Factory Pattern**
   - Repository factory based on configuration
   - Automatic fallback mechanisms

## Architecture Principles

1. **Single Responsibility** - Each class has one reason to change
2. **Open/Closed** - Open for extension, closed for modification
3. **Liskov Substitution** - Implementations are interchangeable
4. **Interface Segregation** - Focused, cohesive interfaces
5. **Dependency Inversion** - Depend on abstractions, not concretions

## Conclusion

The DI architecture provides a solid foundation for the ChessEndgameTrainer application, enabling better testing, maintenance, and future extensibility while maintaining clean separation of concerns.