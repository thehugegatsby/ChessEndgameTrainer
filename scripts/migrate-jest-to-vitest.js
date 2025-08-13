#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔄 Starting Jest to Vitest migration...\n');

// Find all test files
const testPatterns = [
  'src/tests/**/*.{test,spec}.{ts,tsx}',
  'src/features/**/*.{test,spec}.{ts,tsx}'
];

const replacements = [
  // Jest globals to Vitest
  { regex: /\bjest\.fn\(/g, replacement: 'vi.fn(' },
  { regex: /\bjest\.spyOn\(/g, replacement: 'vi.spyOn(' },
  { regex: /\bjest\.mock\(/g, replacement: 'vi.mock(' },
  { regex: /\bjest\.unmock\(/g, replacement: 'vi.unmock(' },
  { regex: /\bjest\.clearAllMocks\(/g, replacement: 'vi.clearAllMocks(' },
  { regex: /\bjest\.resetAllMocks\(/g, replacement: 'vi.resetAllMocks(' },
  { regex: /\bjest\.restoreAllMocks\(/g, replacement: 'vi.restoreAllMocks(' },
  { regex: /\bjest\.useFakeTimers\(/g, replacement: 'vi.useFakeTimers(' },
  { regex: /\bjest\.useRealTimers\(/g, replacement: 'vi.useRealTimers(' },
  { regex: /\bjest\.runAllTimers\(/g, replacement: 'vi.runAllTimers(' },
  { regex: /\bjest\.runOnlyPendingTimers\(/g, replacement: 'vi.runOnlyPendingTimers(' },
  { regex: /\bjest\.advanceTimersByTime\(/g, replacement: 'vi.advanceTimersByTime(' },
  { regex: /\bjest\.clearAllTimers\(/g, replacement: 'vi.clearAllTimers(' },
  { regex: /\bjest\.requireActual\(/g, replacement: 'vi.importActual(' },
  { regex: /\bjest\.requireMock\(/g, replacement: 'vi.importMock(' },
  { regex: /\bjest\.setTimeout\(/g, replacement: 'vi.setConfig({ testTimeout: ' },
  
  // Import fixes for @testing-library/jest-dom
  { regex: /from ['"]@testing-library\/jest-dom['"]/g, replacement: "from '@testing-library/jest-dom/vitest'" },
  
  // Fix bare imports without extensions
  { regex: /from ['"]@shared\/types\/chess['"]/g, replacement: "from '@shared/types/chess.js'" },
  { regex: /from ['"]@shared\/services\/container['"]/g, replacement: "from '@shared/services/container/index.js'" },
  { regex: /from ['"]@shared\/pages\/EndgameTrainingPage['"]/g, replacement: "from '@shared/pages/EndgameTrainingPage.jsx'" },
];

let totalFiles = 0;
let modifiedFiles = 0;

testPatterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: process.cwd() });
  
  files.forEach(file => {
    totalFiles++;
    const filePath = path.join(process.cwd(), file);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Apply all replacements
    replacements.forEach(({ regex, replacement }) => {
      content = content.replace(regex, replacement);
    });
    
    // Add vi import if file uses vi but doesn't import it
    if (content.includes('vi.') && !content.includes("import { vi }") && !content.includes("import {vi}")) {
      content = "import { vi } from 'vitest';\n" + content;
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${file}`);
      modifiedFiles++;
    }
  });
});

console.log(`\n📊 Migration Summary:`);
console.log(`   Total files scanned: ${totalFiles}`);
console.log(`   Files modified: ${modifiedFiles}`);
console.log(`\n✨ Jest to Vitest migration complete!`);