#!/usr/bin/env node

/**
 * Development server starter with centralized port configuration
 */

const { spawn } = require('child_process');
const path = require('path');

// Read the TypeScript config file
const fs = require('fs');
const configPath = path.join(__dirname, '../config/constants.ts');
const configContent = fs.readFileSync(configPath, 'utf8');

// Extract DEV_PORT value
const portMatch = configContent.match(/DEV_PORT:\s*(\d+)/);
const DEV_PORT = portMatch && portMatch[1] ? parseInt(portMatch[1]) : 3002;

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