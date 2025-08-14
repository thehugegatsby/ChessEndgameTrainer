/**
 * HTTP Status Code constants
 * @module constants/http
 * 
 * @description
 * Standard HTTP status codes used throughout the application
 * for API responses and error handling.
 */

/* eslint-disable no-magic-numbers */
// HTTP Status codes are international standards (RFC 7231), not "magic numbers"

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
 * HTTP Status Code Range Boundaries
 * For use in range checking helper functions
 */
export const HTTP_REDIRECTION_START = 300;
export const HTTP_STATUS_MAX_EXCLUSIVE = 600;

/**
 * Helper to check if status code indicates success
 */
export const isSuccessStatus = (status: number): boolean =>
  status >= HttpStatus.OK && status < HTTP_REDIRECTION_START;

/**
 * Helper to check if status code indicates client error
 */
export const isClientErrorStatus = (status: number): boolean =>
  status >= HttpStatus.BAD_REQUEST && status < HttpStatus.INTERNAL_SERVER_ERROR;

/**
 * Helper to check if status code indicates server error
 */
export const isServerErrorStatus = (status: number): boolean =>
  status >= HttpStatus.INTERNAL_SERVER_ERROR && status < HTTP_STATUS_MAX_EXCLUSIVE;