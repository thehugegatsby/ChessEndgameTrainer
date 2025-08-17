/**
 * Evaluation Domain - Testing API
 * 
 * This file provides a clean entry point for all test-related utilities
 * from the evaluation domain. It maintains separation between production
 * and test code while providing a stable testing API.
 */

// Re-export the mock helpers from their internal location
// This decouples consuming tests from internal file structure
export {
  resetMock,
  mockWinPosition,
  mockDrawPosition,
  mockLossPosition,
  mockApiError,
  mockNotAvailable,
  mockLoading,
  clearMockCalls,
} from './services/__mocks__/TablebaseService';