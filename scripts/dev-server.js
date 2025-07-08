#!/usr/bin/env node

/**
 * Development server starter with centralized port configuration
 */

const { spawn } = require('child_process');
const path = require('path');

// Import the config - we'll use the TypeScript compiler to handle this
const configPath = path.join(__dirname, '../config/constants.ts');

// For now, let's just use the hardcoded port from our constants
const DEV_PORT = 3002;

console.log(`Starting development server on port ${DEV_PORT}...`);

// Start Next.js dev server with the configured port
const nextDev = spawn('next', ['dev', '-p', DEV_PORT], {
  stdio: 'inherit',
  shell: true
});

nextDev.on('error', (error) => {
  console.error('Failed to start development server:', error);
  process.exit(1);
});

nextDev.on('exit', (code) => {
  process.exit(code);
});