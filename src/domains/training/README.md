# Training Domain

**Domain-Driven Design: Training Module**

## Overview

This domain handles all chess training functionality, including move feedback, training sessions, event-driven interactions, and progress tracking.

## Architecture

```
domains/training/
├── components/           # React components for training UI
├── events/              # Event system for training interactions
├── hooks/               # React hooks for training logic
├── store/               # Training state management
├── utils/               # Training utilities and helpers
└── __tests__/           # Domain-specific tests
```

## Key Components

- **TrainingEventListener**: Handles training event coordination
- **EventBasedMoveDialogManager**: Manages move feedback dialogs
- **EventEmitter**: Core event system for training interactions
- **useEventDrivenTraining**: Main training hook

## Dependencies

- `@domains/game` - Chess engine and position services
- `@domains/evaluation` - Tablebase evaluation for move quality
- `@shared/types` - Common type definitions
- `@shared/services` - Logging and error handling

## Migration Status

✅ **Migrated from features/training/** - Clean Architecture compliance