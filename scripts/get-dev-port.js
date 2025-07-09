#!/usr/bin/env node

/**
 * Get the development port from the central configuration
 * Used by npm scripts to maintain consistency
 */

// Since we can't directly import TypeScript in package.json scripts,
// we'll read the port from the constants file
const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, '../config/constants.ts');
const constantsContent = fs.readFileSync(constantsPath, 'utf8');

// Extract DEV_PORT value using regex
const portMatch = constantsContent.match(/DEV_PORT:\s*(\d+)/);

if (portMatch && portMatch[1]) {
  console.log(portMatch[1]);
} else {
  console.error('Could not find DEV_PORT in constants.ts');
  process.exit(1);
}