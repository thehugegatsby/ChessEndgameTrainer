#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findDuplicateComponents(dir, components = new Map()) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      findDuplicateComponents(filePath, components);
    } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.jsx'))) {
      const componentName = file.name.replace(/\.(tsx|jsx)$/, '');
      if (!components.has(componentName)) {
        components.set(componentName, []);
      }
      components.get(componentName).push(filePath);
    }
  }
  
  return components;
}

const srcDir = path.join(process.cwd(), 'src');
const components = findDuplicateComponents(srcDir);

let hasDuplicates = false;
for (const [name, paths] of components.entries()) {
  if (paths.length > 1) {
    console.log(`\n❌ Duplicate component "${name}" found in:`);
    paths.forEach(p => console.log(`  - ${path.relative(process.cwd(), p)}`));
    hasDuplicates = true;
  }
}

if (hasDuplicates) {
  console.log('\n⚠️  Please resolve duplicate components before merging.\n');
  process.exit(1);
} else {
  console.log('✅ No duplicate components found.\n');
  process.exit(0);
}