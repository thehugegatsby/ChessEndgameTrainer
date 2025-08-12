#!/usr/bin/env node

/**
 * Kombiniertes Code-Analyse Script
 * Führt alle Code-Qualitäts-Checks nacheinander aus
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting comprehensive code analysis...\n');

const scripts = [
  {
    name: 'Duplicate Components Check',
    file: 'scripts/check-duplicate-components.js',
    description: 'Checking for duplicate React components...'
  },
  {
    name: 'Unused Services Check', 
    file: 'scripts/check-unused-services.js',
    description: 'Checking for unused services...'
  },
  {
    name: 'Unused Files Check',
    file: 'scripts/find-unused-files.js', 
    description: 'Finding unused files...'
  },
  {
    name: 'Deep Unused Analysis',
    file: 'scripts/deep-unused-analysis.js',
    description: 'Running deep analysis for unused code...'
  }
];

let hasErrors = false;

for (const script of scripts) {
  const scriptPath = path.join(process.cwd(), script.file);
  
  // Check if script exists
  if (!fs.existsSync(scriptPath)) {
    console.log(`⚠️  Skipping ${script.name}: Script not found at ${script.file}`);
    continue;
  }
  
  console.log(`\n📋 ${script.name}`);
  console.log(`   ${script.description}`);
  console.log('─'.repeat(60));
  
  try {
    execSync(`node ${script.file}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${script.name} completed successfully`);
  } catch (error) {
    console.error(`❌ ${script.name} failed`);
    hasErrors = true;
    // Continue with other checks even if one fails
  }
}

console.log('\n' + '═'.repeat(60));
if (hasErrors) {
  console.log('⚠️  Code analysis completed with warnings');
  process.exit(1);
} else {
  console.log('✅ All code analysis checks passed!');
  process.exit(0);
}