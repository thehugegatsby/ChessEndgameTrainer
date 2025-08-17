# Evaluation Domain

This domain contains all business logic related to chess position evaluation via tablebase services.

## Purpose

- **Position Evaluation**: Determine win/draw/loss status for chess positions
- **Move Analysis**: Evaluate and rank possible moves in tablebase positions  
- **Evaluation Text**: Generate human-readable German text for evaluations

## Structure

- `services/` - Core evaluation services (TablebaseService)
- `types/` - Domain-specific types and interfaces
- `utils/` - Utility functions (evaluation text generation)
- `__mocks__/` - Test mocks following Vitest standards

## Migration Status

- ✅ Domain structure created
- ⏳ Service migration (TablebaseService) - Phase B.2
- ⏳ Mock migration - Phase B.3  
- ⏳ Import updates - Phase B.4