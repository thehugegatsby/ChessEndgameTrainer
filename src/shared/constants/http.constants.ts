/**
 * @fileoverview HTTP communication and retry logic constants
 * @module constants/http
 * 
 * @description
 * Centralized HTTP configuration for API clients including timeouts,
 * retry strategies, headers, and backoff algorithms. Designed for
 * optimal LLM readability with comprehensive documentation.
 */

/**
 * HTTP configuration defaults
 * 
 * @description
 * Standard timeouts and limits for HTTP requests across the application.
 */
export const HTTP_CONFIG = {
  /**
   * Default request timeout in milliseconds (10 seconds)
   * Used when no specific timeout is provided
   */
  REQUEST_TIMEOUT: 10000,
  
  /**
   * Short timeout for quick operations (5 seconds)
   * Used for simple GET requests that should respond quickly
   */
  REQUEST_TIMEOUT_SHORT: 5000,
  
  /**
   * Long timeout for complex operations (30 seconds)
   * Used for file uploads or complex computations
   */
  REQUEST_TIMEOUT_LONG: 30000,
  
  /**
   * Maximum payload size in bytes (10MB)
   */
  MAX_PAYLOAD_SIZE: 10 * 1024 * 1024,
} as const;

/**
 * HTTP retry strategy configuration
 * 
 * @description
 * Exponential backoff with jitter for resilient API communication.
 * Prevents thundering herd and provides graceful degradation.
 */
export const HTTP_RETRY = {
  /**
   * Maximum number of retry attempts for a failing request
   */
  MAX_RETRIES: 3,
  
  /**
   * Base delay for exponential backoff in milliseconds (1 second)
   * First retry will wait approximately this long
   */
  BACKOFF_BASE_DELAY: 1000,
  
  /**
   * The multiplier for exponential backoff
   * Each retry multiplies the delay by this factor
   * Example: 1s, 2s, 4s, 8s for factor 2
   */
  BACKOFF_FACTOR: 2,
  
  /**
   * Maximum exponent used to cap the backoff delay
   * With factor 2 and exponent 4: max delay = 1000 * 2^4 = 16 seconds
   */
  MAX_BACKOFF_EXPONENT: 4,
  
  /**
   * Jitter factor (0-1) to randomize backoff delay
   * Prevents thundering herd by adding random variance
   * 0.1 = up to 10% additional random delay
   */
  JITTER_FACTOR: 0.1,
  
  /**
   * Delay specifically for rate limiting (5 seconds)
   * Used when server returns 429 Too Many Requests
   */
  RATE_LIMIT_DELAY: 5000,
} as const;

/**
 * Standard HTTP headers
 * 
 * @description
 * Reusable header configurations for different request types.
 */
export const HTTP_HEADERS = {
  /**
   * JSON API headers
   */
  JSON: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  
  /**
   * JSON accept header only (for GET requests)
   */
  ACCEPT_JSON: {
    'Accept': 'application/json',
  },
  
  /**
   * Form data headers
   */
  FORM_DATA: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  
  /**
   * Multipart form data (file uploads)
   * Note: Browser sets Content-Type with boundary automatically
   */
  MULTIPART: {
    'Accept': 'application/json',
  },
} as const;

/**
 * HTTP status code ranges
 * 
 * @description
 * Status code constants and helper functions for response classification.
 */
export const HTTP_STATUS = {
  /**
   * Success status codes
   */
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  /**
   * Redirection status codes
   */
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  
  /**
   * Client error status codes
   */
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  /**
   * Server error status codes
   */
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * HTTP status code ranges for classification
 * 
 * @description
 * Numeric ranges for different status code categories.
 */
export const HTTP_STATUS_RANGES = {
  /**
   * Informational responses (100-199)
   */
  INFORMATIONAL: { MIN: 100, MAX: 199 },
  
  /**
   * Success responses (200-299)
   */
  SUCCESS: { MIN: 200, MAX: 299 },
  
  /**
   * Redirection responses (300-399)
   */
  REDIRECTION: { MIN: 300, MAX: 399 },
  
  /**
   * Client error responses (400-499)
   */
  CLIENT_ERROR: { MIN: 400, MAX: 499 },
  
  /**
   * Server error responses (500-599)
   */
  SERVER_ERROR: { MIN: 500, MAX: 599 },
} as const;

/**
 * Helper functions for status code classification
 * 
 * @description
 * Utility functions to check status code categories.
 */
export const isSuccessStatus = (status: number): boolean =>
  status >= HTTP_STATUS_RANGES.SUCCESS.MIN && status <= HTTP_STATUS_RANGES.SUCCESS.MAX;

export const isClientError = (status: number): boolean =>
  status >= HTTP_STATUS_RANGES.CLIENT_ERROR.MIN && status <= HTTP_STATUS_RANGES.CLIENT_ERROR.MAX;

export const isServerError = (status: number): boolean =>
  status >= HTTP_STATUS_RANGES.SERVER_ERROR.MIN && status <= HTTP_STATUS_RANGES.SERVER_ERROR.MAX;

export const isRetryableError = (status: number): boolean =>
  isServerError(status) || status === HTTP_STATUS.TOO_MANY_REQUESTS;

/**
 * Request method constants
 * 
 * @description
 * HTTP request methods as constants to prevent typos.
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const;

/**
 * Type exports for strict typing
 */
export type HttpConfigConstants = typeof HTTP_CONFIG;
export type HttpRetryConstants = typeof HTTP_RETRY;
export type HttpHeaderConstants = typeof HTTP_HEADERS;
export type HttpStatusConstants = typeof HTTP_STATUS;
export type HttpStatusRangeConstants = typeof HTTP_STATUS_RANGES;
export type HttpMethodConstants = typeof HTTP_METHODS;