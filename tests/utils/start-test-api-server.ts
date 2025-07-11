#!/usr/bin/env node
/**
 * Start Test API Server
 * Entry point for running the test API server
 */

import { testApiServer } from './test-api-server';

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await testApiServer.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await testApiServer.stop();
  process.exit(0);
});

// Start server
testApiServer.start().catch((error) => {
  console.error('Failed to start test API server:', error);
  process.exit(1);
});