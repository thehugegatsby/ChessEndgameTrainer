#!/usr/bin/env ts-node

import { allEndgamePositions } from '../shared/data/endgames';
import chalk from 'chalk';

function findInvalidKeys(obj: any, path = ''): string[] {
  const invalidKeys: string[] = [];
  const keyRegex = /[\.\/\*\[\]]/; // Check for '.', '/', '*', '[', ']'

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newPath = path ? `${path}.${key}` : key;
      
      // Check for invalid characters
      if (keyRegex.test(key) || (key.startsWith('__') && key.endsWith('__'))) {
        invalidKeys.push(newPath);
      }
      
      // Recursively check nested objects
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        invalidKeys.push(...findInvalidKeys(obj[key], newPath));
      }
    }
  }
  return invalidKeys;
}

function checkForNonSerializable(obj: any, path = ''): string[] {
  const problems: string[] = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check for problematic types
      if (typeof value === 'function') {
        problems.push(`Function found at: ${currentPath}`);
      }
      if (typeof value === 'symbol') {
        problems.push(`Symbol found at: ${currentPath}`);
      }
      if (value === undefined) {
        problems.push(`Undefined found at: ${currentPath}`);
      }
      if (value === null) {
        // null is OK in Firestore
      }
      if (value instanceof Date) {
        // Dates need to be Firestore Timestamps
        problems.push(`Date object found at: ${currentPath} - needs to be Firestore Timestamp`);
      }
      
      // Recursively check nested objects
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              problems.push(...checkForNonSerializable(item, `${currentPath}[${index}]`));
            }
          });
        } else {
          problems.push(...checkForNonSerializable(value, currentPath));
        }
      }
    }
  }
  
  return problems;
}

console.log(chalk.blue('🔍 Scanning for Invalid Data in Positions'));
console.log(chalk.gray('======================================\n'));

let hasProblems = false;

allEndgamePositions.forEach((position, index) => {
  const invalidKeys = findInvalidKeys(position);
  const nonSerializable = checkForNonSerializable(position);
  
  if (invalidKeys.length > 0 || nonSerializable.length > 0) {
    hasProblems = true;
    console.log(chalk.red(`\n❌ Position ${position.id} (index ${index}) has problems:`));
    
    if (invalidKeys.length > 0) {
      console.log(chalk.yellow('  Invalid keys:'));
      invalidKeys.forEach(key => console.log(`    - ${key}`));
    }
    
    if (nonSerializable.length > 0) {
      console.log(chalk.yellow('  Non-serializable values:'));
      nonSerializable.forEach(problem => console.log(`    - ${problem}`));
    }
  }
});

if (!hasProblems) {
  console.log(chalk.green('✅ All positions look valid!'));
} else {
  console.log(chalk.red('\n⚠️  Found problems that need to be fixed before migration'));
}

// Also check the first position in detail
console.log(chalk.blue('\n📋 First position details:'));
console.log(JSON.stringify(allEndgamePositions[0], null, 2));