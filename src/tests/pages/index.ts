/**
 * Page Objects Index
 * Centralized exports for all page objects
 */

export { BasePage } from './BasePage';
export { FirestoreDebugPage } from './FirestoreDebugPage';
export { LoginPage } from './LoginPage';

// Type exports
export type {
  FirestoreConnectionInfo,
  FirestoreDataStats,
  FirestoreValidationResult,
} from './FirestoreDebugPage';
