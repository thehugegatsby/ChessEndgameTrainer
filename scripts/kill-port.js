#!/usr/bin/env node

/**
 * Kill process running on the configured development port
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read the TypeScript config file
const configPath = path.join(__dirname, '../config/constants.ts');
const configContent = fs.readFileSync(configPath, 'utf8');

// Extract DEV_PORT value
const portMatch = configContent.match(/DEV_PORT:\s*(\d+)/);
const DEV_PORT = portMatch && portMatch[1] ? parseInt(portMatch[1]) : 3002;

console.log(`Attempting to kill process on port ${DEV_PORT}...`);

// Platform-specific commands
const isWindows = process.platform === 'win32';

if (isWindows) {
  // Windows command
  exec(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${DEV_PORT}') do taskkill /f /pid %a`, (err, stdout, stderr) => {
    if (err) {
      console.log(`No process found on port ${DEV_PORT} or already killed`);
    } else {
      console.log(`Successfully killed process on port ${DEV_PORT}`);
    }
  });
} else {
  // Unix/Linux/Mac command
  exec(`lsof -ti:${DEV_PORT} | xargs kill -9`, (err, stdout, stderr) => {
    if (err) {
      console.log(`No process found on port ${DEV_PORT} or already killed`);
    } else {
      console.log(`Successfully killed process on port ${DEV_PORT}`);
    }
  });
}