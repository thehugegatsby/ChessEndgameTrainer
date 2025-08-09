/**
 * @file Result Type for Error Handling Standardization
 * @description Type-safe error handling for API services using discriminated unions
 * 
 * @example
 * ```typescript
 * import { Result, ok, err, isOk } from '@shared/utils/result';
 * 
 * async function apiCall(): Promise<Result<User, AppError>> {
 *   try {
 *     const user = await fetchUser();
 *     return ok(user);
 *   } catch (error) {
 *     return err(new AppError('User not found'));
 *   }
 * }
 * 
 * const result = await apiCall();
 * if (isOk(result)) {
 *   // Access result.value.name safely - TypeScript knows this is safe
 * } else {
 *   // Handle error: result.error.message
 * }
 * ```
 */

/**
 * A base error class for the application. This allows us to
 * differentiate between expected application errors and unexpected
 * system errors. You can extend this for more specific error types
 * (e.g., ApiError, ValidationError).
 */
export class AppError extends Error {
  public readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.context = context;
  }
}

// Discriminated union for our Result type
type Ok<T> = { ok: true; value: T };
type Err<E> = { ok: false; error: E };

/**
 * Result type for type-safe error handling
 * 
 * @template T - The success value type
 * @template E - The error type (extends Error, defaults to AppError)
 */
export type Result<T, E extends Error = AppError> = Ok<T> | Err<E>;

/**
 * Helper function to create a success (Ok) result.
 * 
 * @param value - The success value
 * @returns Ok result containing the value
 */
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

/**
 * Helper function to create an error (Err) result.
 * 
 * @param error - The error instance
 * @returns Err result containing the error
 */
export const err = <E extends Error>(error: E): Err<E> => ({ ok: false, error });

/**
 * Type guard to check if a result is a success (Ok).
 * Enables TypeScript control flow analysis.
 * 
 * @param result - The result to check
 * @returns true if result is Ok, false if Err
 */
export const isOk = <T, E extends Error>(result: Result<T, E>): result is Ok<T> => result.ok;

/**
 * Type guard to check if a result is an error (Err).
 * Enables TypeScript control flow analysis.
 * 
 * @param result - The result to check  
 * @returns true if result is Err, false if Ok
 */
export const isErr = <T, E extends Error>(result: Result<T, E>): result is Err<E> => !result.ok;