/**
 * @fileoverview Custom Error Types for E2E Tests
 * @description Provides specific error classes for better debugging
 */

/**
 * Base error class for E2E test errors
 */
export class E2EError extends Error {
  constructor(message: string, public readonly context?: any) {
    super(message);
    this.name = 'E2EError';
  }
}

/**
 * Navigation-related errors
 */
export class NavigationError extends E2EError {
  constructor(message: string, context?: any) {
    super(message, context);
    this.name = 'NavigationError';
  }
}

/**
 * Invalid move number error
 */
export class InvalidMoveError extends NavigationError {
  constructor(moveNumber: number, totalMoves: number) {
    super(
      `Invalid move number ${moveNumber}. Valid range: 0-${totalMoves - 1}`,
      { moveNumber, totalMoves, validRange: `0-${totalMoves - 1}` }
    );
    this.name = 'InvalidMoveError';
  }
}

/**
 * Component initialization errors
 */
export class ComponentInitializationError extends E2EError {
  constructor(componentName: string, originalError: Error) {
    super(`Failed to initialize ${componentName}`, { componentName, originalError });
    this.name = 'ComponentInitializationError';
  }
}

/**
 * Synchronization errors
 */
export class SynchronizationError extends E2EError {
  constructor(message: string, timeout: number, context?: any) {
    super(`${message} (timeout: ${timeout}ms)`, { ...context, timeout });
    this.name = 'SynchronizationError';
  }
}

/**
 * Test bridge errors
 */
export class TestBridgeError extends E2EError {
  constructor(message: string, operation: string, context?: any) {
    super(`Test bridge error during ${operation}: ${message}`, { operation, ...context });
    this.name = 'TestBridgeError';
  }
}