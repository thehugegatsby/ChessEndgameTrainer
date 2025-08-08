#!/usr/bin/env node

/**
 * Helper script to get port values for npm scripts
 * Usage: node scripts/get-port.js <PORT_NAME>
 */

const { PORTS } = require('../config/ports');

const portName = process.argv[2];

if (!portName) {
  console.error('Usage: node scripts/get-port.js <PORT_NAME>');
  process.exit(1);
}

const port = PORTS[portName];

if (port === undefined) {
  console.error(`Unknown port name: ${portName}`);
  console.error('Available ports:', Object.keys(PORTS).join(', '));
  process.exit(1);
}

// Output just the port number for use in scripts
console.log(port);