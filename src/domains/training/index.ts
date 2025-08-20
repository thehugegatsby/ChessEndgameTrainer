/**
 * Training Domain - Public API
 *
 * This barrel file exports all public components, hooks, services, and types
 * from the training domain module.
 */

// Components
// export { TrainingEventListener } from './components/TrainingEventListener'; // Moved to _legacy

// Events
export { EventBasedMoveDialogManager } from './events/EventBasedMoveDialogManager';
export { TrainingEventEmitter, trainingEvents } from './events/EventEmitter';

// Hooks
export { useMoveDialogManager } from './hooks/useEventDrivenTraining';

// Types
// TODO: Create training types when needed

// Utils
// TODO: Migrate utility functions when identified

// Store
// TODO: Migrate training store when created