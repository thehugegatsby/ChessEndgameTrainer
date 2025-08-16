#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const allFiles = new Set();
const importedFiles = new Set();
const unusedFiles = new Set();

// File extensions to analyze
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to analyze
const DIRECTORIES_TO_ANALYZE = [
  'shared/components',
  'shared/services',
  'shared/lib',
  'shared/types',
  'shared/hooks',
  'shared/utils',
  'shared/contexts',
  'shared/constants',
  'shared/store',
  'pages',
  'app',
];

// Files to ignore
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /\.d\.ts$/,
  /coverage/,
  /\.next/,
  /\.config\./,
  /setup\./,
  /README/,
  /\.md$/,
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

function getAllFiles(dir, baseDir = dir) {
  const files = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.relative(projectRoot, fullPath);

      if (shouldIgnore(relativePath)) continue;

      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...getAllFiles(fullPath, baseDir));
      } else if (EXTENSIONS.some(ext => fullPath.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return files;
}

function findImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = new Set();

    // Match various import patterns
    const importPatterns = [
      /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g,
      /require\s*\(['"]([^'"]+)['"]\)/g,
      /export\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g,
      /import\s*\(['"]([^'"]+)['"]\)/g, // Dynamic imports
    ];

    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];

        // Skip external modules
        if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
          continue;
        }

        // Resolve the import path
        const dir = path.dirname(filePath);
        let resolvedPath = path.resolve(dir, importPath);

        // Try different extensions if file doesn't exist
        if (!fs.existsSync(resolvedPath)) {
          for (const ext of EXTENSIONS) {
            const pathWithExt = resolvedPath + ext;
            if (fs.existsSync(pathWithExt)) {
              resolvedPath = pathWithExt;
              break;
            }
          }

          // Check if it's a directory with index file
          const indexPaths = EXTENSIONS.map(ext => path.join(resolvedPath, `index${ext}`));
          for (const indexPath of indexPaths) {
            if (fs.existsSync(indexPath)) {
              resolvedPath = indexPath;
              break;
            }
          }
        }

        if (fs.existsSync(resolvedPath)) {
          imports.add(resolvedPath);
        }
      }
    }

    return imports;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return new Set();
  }
}

function isFileImportedUsingGrep(filePath) {
  const fileName = path.basename(filePath);
  const fileNameWithoutExt = fileName.replace(/\.[^.]+$/, '');

  try {
    // Search for imports of this file
    const searchPatterns = [
      `'.*${fileNameWithoutExt}'`,
      `".*${fileNameWithoutExt}"`,
      `'.*${fileName}'`,
      `".*${fileName}"`,
    ];

    for (const pattern of searchPatterns) {
      try {
        const result = execSync(
          `grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l "${pattern}" "${projectRoot}/shared" "${projectRoot}/pages" "${projectRoot}/app" 2>/dev/null || true`,
          { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }
        );

        if (result.trim()) {
          return true;
        }
      } catch (e) {
        // Ignore grep errors
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

// Main analysis
console.log('Analyzing EndgameTrainer codebase for unused files...\n');

// Collect all files
for (const dir of DIRECTORIES_TO_ANALYZE) {
  const fullPath = path.join(projectRoot, dir);
  if (fs.existsSync(fullPath)) {
    const files = getAllFiles(fullPath);
    files.forEach(file => allFiles.add(file));
  }
}

console.log(`Total files to analyze: ${allFiles.size}\n`);

// Build import graph
console.log('Building import graph...');
const importGraph = new Map();

for (const file of allFiles) {
  const imports = findImports(file);
  importGraph.set(file, imports);
  imports.forEach(imp => importedFiles.add(imp));
}

// Find entry points
const entryPoints = [
  path.join(projectRoot, 'pages', '_app.tsx'),
  path.join(projectRoot, 'pages', 'index.tsx'),
  path.join(projectRoot, 'pages', 'train', '[id].tsx'),
  path.join(projectRoot, 'app', 'mobile', 'App.tsx'),
];

// Find all reachable files from entry points
const reachableFiles = new Set();
const toVisit = [...entryPoints.filter(ep => allFiles.has(ep))];

while (toVisit.length > 0) {
  const current = toVisit.pop();
  if (reachableFiles.has(current)) continue;

  reachableFiles.add(current);

  const imports = importGraph.get(current) || new Set();
  for (const imp of imports) {
    if (!reachableFiles.has(imp) && allFiles.has(imp)) {
      toVisit.push(imp);
    }
  }
}

// Double-check with grep for files that might be imported differently
console.log('\nDouble-checking with grep...');
for (const file of allFiles) {
  if (!reachableFiles.has(file) && !shouldIgnore(file)) {
    if (!isFileImportedUsingGrep(file)) {
      unusedFiles.add(file);
    }
  }
}

// Categorize unused files
const categories = {
  components: [],
  services: [],
  lib: [],
  types: [],
  hooks: [],
  utils: [],
  contexts: [],
  constants: [],
  store: [],
  other: [],
};

for (const file of unusedFiles) {
  const relativePath = path.relative(projectRoot, file);

  if (relativePath.includes('shared/components/')) {
    categories.components.push(relativePath);
  } else if (relativePath.includes('shared/services/')) {
    categories.services.push(relativePath);
  } else if (relativePath.includes('shared/lib/')) {
    categories.lib.push(relativePath);
  } else if (relativePath.includes('shared/types/')) {
    categories.types.push(relativePath);
  } else if (relativePath.includes('shared/hooks/')) {
    categories.hooks.push(relativePath);
  } else if (relativePath.includes('shared/utils/')) {
    categories.utils.push(relativePath);
  } else if (relativePath.includes('shared/contexts/')) {
    categories.contexts.push(relativePath);
  } else if (relativePath.includes('shared/constants/')) {
    categories.constants.push(relativePath);
  } else if (relativePath.includes('shared/store/')) {
    categories.store.push(relativePath);
  } else {
    categories.other.push(relativePath);
  }
}

// Output results
console.log('\n=== UNUSED FILES REPORT ===\n');

for (const [category, files] of Object.entries(categories)) {
  if (files.length > 0) {
    console.log(
      `\n## Unused ${category.charAt(0).toUpperCase() + category.slice(1)} (${files.length}):`
    );
    files.sort().forEach(file => console.log(`  - ${file}`));
  }
}

console.log(`\n\nTotal unused files: ${unusedFiles.size}`);
console.log(`Total files analyzed: ${allFiles.size}`);
console.log(`Percentage unused: ${((unusedFiles.size / allFiles.size) * 100).toFixed(1)}%`);

// Write detailed report
const reportPath = path.join(projectRoot, 'UNUSED_FILES_DETAILED_REPORT.md');
let report = '# Unused Files Report\n\n';
report += `Generated on: ${new Date().toISOString()}\n\n`;
report += `- Total files analyzed: ${allFiles.size}\n`;
report += `- Total unused files: ${unusedFiles.size}\n`;
report += `- Percentage unused: ${((unusedFiles.size / allFiles.size) * 100).toFixed(1)}%\n\n`;

for (const [category, files] of Object.entries(categories)) {
  if (files.length > 0) {
    report += `## Unused ${category.charAt(0).toUpperCase() + category.slice(1)} (${files.length})\n\n`;
    files.sort().forEach(file => {
      report += `- \`${file}\`\n`;
    });
    report += '\n';
  }
}

fs.writeFileSync(reportPath, report);
console.log(`\nDetailed report written to: ${reportPath}`);
