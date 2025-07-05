#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');

// Categories to analyze
const analysisTargets = {
  // Unused functions/utilities
  functions: {
    patterns: [
      /export\s+(?:const|function|async\s+function)\s+(\w+)/g,
      /export\s+{\s*([^}]+)\s*}/g
    ],
    directories: ['shared/utils', 'shared/lib'],
    description: 'Exported functions and utilities'
  },
  
  // Unused types/interfaces
  types: {
    patterns: [
      /export\s+(?:type|interface)\s+(\w+)/g,
      /export\s+{\s*type\s+(\w+)\s*}/g
    ],
    directories: ['shared/types'],
    description: 'Exported types and interfaces'
  },
  
  // Unused constants
  constants: {
    patterns: [
      /export\s+const\s+([A-Z_]+)\s*=/g
    ],
    directories: ['shared/constants'],
    description: 'Exported constants'
  },
  
  // Unused React hooks
  hooks: {
    patterns: [
      /export\s+(?:const|function)\s+(use\w+)/g
    ],
    directories: ['shared/hooks'],
    description: 'Custom React hooks'
  },
  
  // Potentially dead code paths
  deadCode: {
    patterns: [
      /if\s*\(\s*false\s*\)/g,
      /return;[\s\S]+?}/g,  // Code after early return
      /\/\*[\s\S]*?\*\//g    // Large comment blocks that might be commented code
    ],
    directories: ['shared', 'pages'],
    description: 'Potential dead code patterns'
  }
};

function findExportedItems(filePath, patterns) {
  const items = new Set();
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) {
          // Handle multiple exports in one statement
          const exports = match[1].split(',').map(e => e.trim());
          exports.forEach(exp => {
            const name = exp.split(/\s+as\s+/)[0].trim();
            if (name && !name.includes('{') && !name.includes('}')) {
              items.add(name);
            }
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
  
  return items;
}

function isItemUsed(itemName, excludeFile) {
  try {
    // Build grep command to search for usage
    const grepCmd = `grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l "\\b${itemName}\\b" "${projectRoot}/shared" "${projectRoot}/pages" "${projectRoot}/app" 2>/dev/null || true`;
    
    const result = execSync(grepCmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
    const files = result.trim().split('\n').filter(f => f && f !== excludeFile);
    
    return files.length > 0;
  } catch (error) {
    return false;
  }
}

function getAllFilesInDir(dir) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('test') && item !== 'node_modules') {
        files.push(...getAllFilesInDir(fullPath));
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
        if (!item.includes('.test.') && !item.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

// Additional specific checks
function checkForUnusedHooks() {
  const hooksDir = path.join(projectRoot, 'shared/hooks');
  const hooks = new Map();
  
  try {
    const files = getAllFilesInDir(hooksDir);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const hookPattern = /export\s+(?:const|function)\s+(use\w+)/g;
      let match;
      
      while ((match = hookPattern.exec(content)) !== null) {
        hooks.set(match[1], file);
      }
    }
    
    // Check optimized versions
    if (content.includes('Optimized')) {
      const baseName = path.basename(file).replace('Optimized', '').replace('.ts', '').replace('.tsx', '');
      console.log(`Found optimized version: ${file} (base: ${baseName})`);
    }
  } catch (error) {
    console.error('Error checking hooks:', error);
  }
  
  return hooks;
}

function checkDuplicateImplementations() {
  const patterns = [
    { base: 'useChessGame', optimized: 'useChessGameOptimized' },
    { base: 'useEvaluation', optimized: 'useEvaluationOptimized' },
    { base: 'TrainingContext', optimized: 'TrainingContextOptimized' }
  ];
  
  const duplicates = [];
  
  for (const { base, optimized } of patterns) {
    try {
      // Check if optimized version is actually used
      const optimizedUsage = execSync(
        `grep -r --include="*.ts" --include="*.tsx" -l "${optimized}" "${projectRoot}/shared" "${projectRoot}/pages" 2>/dev/null | grep -v "${optimized}.ts" || true`,
        { encoding: 'utf8' }
      );
      
      const baseUsage = execSync(
        `grep -r --include="*.ts" --include="*.tsx" -l "${base}" "${projectRoot}/shared" "${projectRoot}/pages" 2>/dev/null | grep -v "${base}.ts" || true`,
        { encoding: 'utf8' }
      );
      
      duplicates.push({
        base,
        optimized,
        baseUsageCount: baseUsage.trim().split('\n').filter(l => l).length,
        optimizedUsageCount: optimizedUsage.trim().split('\n').filter(l => l).length
      });
    } catch (error) {
      // Ignore errors
    }
  }
  
  return duplicates;
}

// Run analysis
console.log('=== DEEP UNUSED CODE ANALYSIS ===\n');

// Check for duplicate implementations
console.log('## Checking for duplicate implementations...\n');
const duplicates = checkDuplicateImplementations();
duplicates.forEach(({ base, optimized, baseUsageCount, optimizedUsageCount }) => {
  console.log(`- ${base}: ${baseUsageCount} usages`);
  console.log(`  ${optimized}: ${optimizedUsageCount} usages`);
  if (optimizedUsageCount === 0) {
    console.log(`  ⚠️  Optimized version appears unused!`);
  }
  console.log('');
});

// Analyze each category
for (const [category, config] of Object.entries(analysisTargets)) {
  console.log(`\n## Analyzing ${config.description}...\n`);
  
  const unusedItems = [];
  
  for (const dir of config.directories) {
    const fullPath = path.join(projectRoot, dir);
    if (!fs.existsSync(fullPath)) continue;
    
    const files = getAllFilesInDir(fullPath);
    
    for (const file of files) {
      const items = findExportedItems(file, config.patterns);
      
      for (const item of items) {
        if (!isItemUsed(item, file)) {
          unusedItems.push({
            item,
            file: path.relative(projectRoot, file)
          });
        }
      }
    }
  }
  
  if (unusedItems.length > 0) {
    console.log(`Found ${unusedItems.length} unused ${category}:`);
    unusedItems.forEach(({ item, file }) => {
      console.log(`  - ${item} in ${file}`);
    });
  } else {
    console.log(`No unused ${category} found.`);
  }
}

// Check for specific patterns
console.log('\n## Checking for specific code patterns...\n');

// Check for console.log statements
const consoleLogFiles = execSync(
  `grep -r --include="*.ts" --include="*.tsx" -l "console\\.log" "${projectRoot}/shared" "${projectRoot}/pages" 2>/dev/null | grep -v test || true`,
  { encoding: 'utf8' }
).trim().split('\n').filter(f => f);

if (consoleLogFiles.length > 0) {
  console.log(`Files with console.log statements (${consoleLogFiles.length}):`);
  consoleLogFiles.slice(0, 10).forEach(file => {
    console.log(`  - ${path.relative(projectRoot, file)}`);
  });
  if (consoleLogFiles.length > 10) {
    console.log(`  ... and ${consoleLogFiles.length - 10} more`);
  }
}

// Check for TODO comments
const todoFiles = execSync(
  `grep -r --include="*.ts" --include="*.tsx" -l "TODO\\|FIXME\\|HACK" "${projectRoot}/shared" "${projectRoot}/pages" 2>/dev/null || true`,
  { encoding: 'utf8' }
).trim().split('\n').filter(f => f);

if (todoFiles.length > 0) {
  console.log(`\nFiles with TODO/FIXME/HACK comments (${todoFiles.length}):`);
  todoFiles.slice(0, 10).forEach(file => {
    console.log(`  - ${path.relative(projectRoot, file)}`);
  });
}

// Check for large files that might need refactoring
console.log('\n## Large files that might need refactoring:\n');
const largeFiles = execSync(
  `find "${projectRoot}/shared" "${projectRoot}/pages" -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20 | grep -v total || true`,
  { encoding: 'utf8' }
).trim().split('\n').filter(f => f);

largeFiles.forEach(line => {
  const [lines, file] = line.trim().split(/\s+/);
  if (parseInt(lines) > 200) {
    console.log(`  - ${path.relative(projectRoot, file)}: ${lines} lines`);
  }
});

// Write comprehensive report
const reportPath = path.join(projectRoot, 'DEEP_ANALYSIS_REPORT.md');
let report = '# Deep Code Analysis Report\n\n';
report += `Generated on: ${new Date().toISOString()}\n\n`;

report += '## Summary\n\n';
report += `- Console.log statements found in ${consoleLogFiles.length} files\n`;
report += `- TODO/FIXME comments found in ${todoFiles.length} files\n`;
report += `- Duplicate implementations found: ${duplicates.filter(d => d.optimizedUsageCount === 0).length}\n\n`;

report += '## Duplicate Implementations\n\n';
duplicates.forEach(({ base, optimized, baseUsageCount, optimizedUsageCount }) => {
  report += `### ${base} vs ${optimized}\n`;
  report += `- Base version: ${baseUsageCount} usages\n`;
  report += `- Optimized version: ${optimizedUsageCount} usages\n`;
  if (optimizedUsageCount === 0) {
    report += `- **Status**: ⚠️ Optimized version appears unused\n`;
  }
  report += '\n';
});

fs.writeFileSync(reportPath, report);
console.log(`\n\nDetailed analysis report written to: ${reportPath}`);