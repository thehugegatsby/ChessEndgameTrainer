#!/usr/bin/env node

const { execSync } = require('child_process');

// Run linter and capture output
const output = execSync('npx next lint', { encoding: 'utf8' }).split('\n');

const issues = {
  errors: {},
  warnings: {}
};

let currentFile = '';

output.forEach(line => {
  // Match file path
  if (line.startsWith('./')) {
    currentFile = line.trim();
    return;
  }
  
  // Match error or warning
  const errorMatch = line.match(/^\d+:\d+\s+Error:\s+(.+?)\s+(.+)$/);
  const warningMatch = line.match(/^\d+:\d+\s+Warning:\s+(.+?)\s+(.+)$/);
  
  if (errorMatch) {
    const [, message, rule] = errorMatch;
    if (!issues.errors[rule]) issues.errors[rule] = 0;
    issues.errors[rule]++;
  } else if (warningMatch) {
    const [, message, rule] = warningMatch;
    if (!issues.warnings[rule]) issues.warnings[rule] = 0;
    issues.warnings[rule]++;
  }
});

// Sort by count
const sortByCount = (obj) => Object.entries(obj)
  .sort(([,a], [,b]) => b - a)
  .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

issues.errors = sortByCount(issues.errors);
issues.warnings = sortByCount(issues.warnings);

// Calculate totals
const totalErrors = Object.values(issues.errors).reduce((a, b) => a + b, 0);
const totalWarnings = Object.values(issues.warnings).reduce((a, b) => a + b, 0);

// Output results
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                   LINTER ERROR ANALYSIS                       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`📊 SUMMARY: ${totalErrors} Errors, ${totalWarnings} Warnings\n`);

console.log('🔴 ERRORS (by frequency):');
console.log('─'.repeat(60));
Object.entries(issues.errors).forEach(([rule, count]) => {
  console.log(`  ${count.toString().padStart(3)} | ${rule}`);
});

console.log('\n🟡 WARNINGS (by frequency):');
console.log('─'.repeat(60));
Object.entries(issues.warnings).slice(0, 15).forEach(([rule, count]) => {
  console.log(`  ${count.toString().padStart(3)} | ${rule}`);
});

if (Object.keys(issues.warnings).length > 15) {
  console.log(`  ... and ${Object.keys(issues.warnings).length - 15} more warning types`);
}

// Categories
console.log('\n📂 CATEGORIZED ISSUES:');
console.log('─'.repeat(60));

const categories = {
  'Type Imports': ['@typescript-eslint/consistent-type-imports'],
  'Code Complexity': ['complexity', 'max-lines-per-function', 'max-depth', 'max-lines'],
  'Type Safety': ['@typescript-eslint/explicit-function-return-type', '@typescript-eslint/no-non-null-assertion', 'no-implicit-coercion'],
  'Code Style': ['no-nested-ternary', 'no-param-reassign', '@typescript-eslint/naming-convention'],
  'React': ['react/no-array-index-key']
};

Object.entries(categories).forEach(([category, rules]) => {
  const categoryErrors = rules.reduce((sum, rule) => sum + (issues.errors[rule] || 0), 0);
  const categoryWarnings = rules.reduce((sum, rule) => sum + (issues.warnings[rule] || 0), 0);
  
  if (categoryErrors > 0 || categoryWarnings > 0) {
    console.log(`\n${category}:`);
    console.log(`  Errors: ${categoryErrors}, Warnings: ${categoryWarnings}`);
    rules.forEach(rule => {
      const e = issues.errors[rule] || 0;
      const w = issues.warnings[rule] || 0;
      if (e > 0 || w > 0) {
        console.log(`    - ${rule}: ${e}E/${w}W`);
      }
    });
  }
});

console.log('\n✅ RECOMMENDED FIXES (by priority):');
console.log('─'.repeat(60));
console.log('1. Run: npx eslint --fix . (auto-fix type imports)');
console.log('2. Add "import type" for TypeScript type-only imports');
console.log('3. Add explicit return types to functions');
console.log('4. Refactor complex functions (split into smaller ones)');
console.log('5. Replace !! with Boolean() for type coercion');
console.log('6. Flatten nested ternary expressions');