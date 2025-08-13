#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing Vitest imports...\n');

const testPatterns = [
  'src/tests/**/*.{test,spec}.{ts,tsx}',
  'src/features/**/*.{test,spec}.{ts,tsx}'
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
    
    // Check if file uses test globals without importing them
    const usesTestGlobals = 
      content.includes('describe(') || 
      content.includes('it(') ||
      content.includes('test(') ||
      content.includes('beforeEach(') ||
      content.includes('afterEach(') ||
      content.includes('beforeAll(') ||
      content.includes('afterAll(') ||
      content.includes('expect(');
    
    const hasVitestImport = content.includes("from 'vitest'") || content.includes('from "vitest"');
    
    if (usesTestGlobals && !hasVitestImport) {
      // Add vitest import at the top of the file
      const vitestImports = [];
      
      if (content.includes('describe(')) vitestImports.push('describe');
      if (content.includes('it(') || content.includes('test(')) {
        vitestImports.push('it');
        vitestImports.push('test');
      }
      if (content.includes('expect(')) vitestImports.push('expect');
      if (content.includes('beforeEach(')) vitestImports.push('beforeEach');
      if (content.includes('afterEach(')) vitestImports.push('afterEach');
      if (content.includes('beforeAll(')) vitestImports.push('beforeAll');
      if (content.includes('afterAll(')) vitestImports.push('afterAll');
      if (content.includes('vi.')) vitestImports.push('vi');
      
      const importStatement = `import { ${[...new Set(vitestImports)].join(', ')} } from 'vitest';\n`;
      
      // Find the right place to insert (after existing imports or at the beginning)
      const firstImportMatch = content.match(/^import .* from/m);
      if (firstImportMatch) {
        // Add after the first import
        const insertPosition = firstImportMatch.index;
        content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
      } else {
        // Add at the beginning
        content = importStatement + content;
      }
    }
    
    // Fix import extensions
    content = content.replace(/from ['"]@shared\/types\/chess['"]/g, "from '@shared/types/chess'");
    content = content.replace(/from ['"]@shared\/services\/container['"]/g, "from '@shared/services/container/index'");
    content = content.replace(/from ['"]@shared\/pages\/EndgameTrainingPage['"]/g, "from '@shared/pages/EndgameTrainingPage'");
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed imports in: ${file}`);
      modifiedFiles++;
    }
  });
});

console.log(`\n📊 Import Fix Summary:`);
console.log(`   Total files scanned: ${totalFiles}`);
console.log(`   Files modified: ${modifiedFiles}`);
console.log(`\n✨ Vitest import fixes complete!`);