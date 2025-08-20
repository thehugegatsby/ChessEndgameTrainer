/**
 * Result type for explicit error handling
 * Inspired by Rust's Result<T, E> pattern
 */
export type Result<T, E extends { code: string; message: string }> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function createOk<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function createError<E extends { code: string; message: string }>(
  error: E
): Result<never, E> {
  return { ok: false, error };
}

// Helper functions
export function isOk<T, E extends { code: string; message: string }>(
  result: Result<T, E>
): result is { ok: true; value: T } {
  return result.ok;
}

export function isError<T, E extends { code: string; message: string }>(
  result: Result<T, E>
): result is { ok: false; error: E } {
  return !result.ok;
}

// Map function for Result type
export function mapResult<T, U, E extends { code: string; message: string }>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.ok) {
    return createOk(fn(result.value));
  }
  return result;
}

// FlatMap for chaining Results
export function flatMapResult<T, U, E extends { code: string; message: string }>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}