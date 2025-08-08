/**
 * Custom error classes for PositionService
 * Provides consistent error handling across the service layer
 */

/**
 * Base error class for position-related errors
 */
export class PositionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "PositionError";
    Object.setPrototypeOf(this, PositionError.prototype);
  }
}

/**
 * Thrown when a requested position is not found
 */
export class PositionNotFoundError extends PositionError {
  constructor(id: number) {
    super(`Position with id ${id} not found`, "POSITION_NOT_FOUND");
    this.name = "PositionNotFoundError";
    Object.setPrototypeOf(this, PositionNotFoundError.prototype);
  }
}

/**
 * Thrown when position data is invalid
 */
export class InvalidPositionError extends PositionError {
  constructor(message: string) {
    super(message, "INVALID_POSITION");
    this.name = "InvalidPositionError";
    Object.setPrototypeOf(this, InvalidPositionError.prototype);
  }
}

/**
 * Thrown when a repository operation fails
 */
export class RepositoryError extends PositionError {
  constructor(operation: string, originalError: Error) {
    super(
      `Repository operation '${operation}' failed: ${originalError.message}`,
      "REPOSITORY_ERROR",
    );
    this.name = "RepositoryError";
    Object.setPrototypeOf(this, RepositoryError.prototype);
  }
}
