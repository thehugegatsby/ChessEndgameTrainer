/**
 * HTTP Status Code constants
 * @module constants/http
 * 
 * @description
 * Standard HTTP status codes used throughout the application
 * for API responses and error handling.
 */

/**
 * HTTP Status codes enum for type-safe status code handling
 */
export enum HttpStatus {
  // 2xx Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // 3xx Redirection
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,

  // 4xx Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Helper to check if status code indicates success
 */
export const isSuccessStatus = (status: number): boolean =>
  status >= 200 && status < 300;

/**
 * Helper to check if status code indicates client error
 */
export const isClientErrorStatus = (status: number): boolean =>
  status >= 400 && status < 500;

/**
 * Helper to check if status code indicates server error
 */
export const isServerErrorStatus = (status: number): boolean =>
  status >= 500 && status < 600;