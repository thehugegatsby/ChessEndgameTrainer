/**
 * Firebase Test Setup
 * Configures the test environment for Firebase integration tests
 */

// Set up fetch for Firebase Auth in Node environment
import fetch from 'node-fetch';

// Make fetch available globally for Firebase Auth
(global as any).fetch = fetch;
(global as any).Headers = fetch.Headers;
(global as any).Request = fetch.Request;
(global as any).Response = fetch.Response;

// Export for use in tests
export {};