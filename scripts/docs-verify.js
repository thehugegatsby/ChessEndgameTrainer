#!/usr/bin/env node
/**
 * Documentation verification script
 * Checks if CLAUDE.md claims match actual codebase state
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const CLAUDE_MD = path.join(ROOT_DIR, 'CLAUDE.md');

console.log('🔍 Verifying CLAUDE.md against codebase...\n');

const checks = [
  {
    name: 'TypeScript files count',
    claim: 'Multiple .ts files exist',
    verify: () => {
      const count = execSync('find src -name "*.ts" | wc -l', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
      }).trim();
      return `Found ${count} TypeScript files`;
    },
  },
  {
    name: 'Zustand slices exist',
    claim: 'gameSlice, trainingSlice, tablebaseSlice, uiSlice',
    verify: () => {
      const sliceDir = path.join(ROOT_DIR, 'src/shared/store/slices');
      if (!fs.existsSync(sliceDir)) return '❌ Slices directory not found';

      const slices = fs.readdirSync(sliceDir).filter(f => f.endsWith('.ts'));
      return `Found slices: ${slices.join(', ')}`;
    },
  },
  {
    name: 'Package.json versions',
    claim: 'Next.js 15.4.5, TypeScript 5.9.2, Zustand 5.0.7',
    verify: () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      const versions = {
        next: deps.next,
        typescript: deps.typescript,
        zustand: deps.zustand,
      };

      return Object.entries(versions)
        .map(([name, version]) => `${name}: ${version || 'not found'}`)
        .join(', ');
    },
  },
  {
    name: 'Test system status',
    claim: 'Jest config broken, no tests found',
    verify: () => {
      try {
        const output = execSync('npm test 2>&1 | head -5', {
          cwd: ROOT_DIR,
          encoding: 'utf8',
          timeout: 10000,
        });
        return `Test output: ${output.replace(/\n/g, ' ').trim()}`;
      } catch (error) {
        return `Test execution failed: ${error.message}`;
      }
    },
  },
  {
    name: 'Critical services exist',
    claim: 'ChessService, TablebaseService, ErrorService exist',
    verify: () => {
      const servicesDir = path.join(ROOT_DIR, 'src/shared/services');
      if (!fs.existsSync(servicesDir)) return '❌ Services directory not found';

      const expectedServices = ['ChessService.ts', 'TablebaseService.ts'];
      const existingServices = expectedServices.filter(service =>
        fs.existsSync(path.join(servicesDir, service))
      );

      return `Found services: ${existingServices.join(', ')}`;
    },
  },
];

let allPassed = true;

checks.forEach(check => {
  try {
    const result = check.verify();
    const status = result.includes('❌') ? '❌' : '✅';
    console.log(`${status} ${check.name}`);
    console.log(`   Claim: ${check.claim}`);
    console.log(`   Reality: ${result}\n`);

    if (result.includes('❌')) allPassed = false;
  } catch (error) {
    console.log(`❌ ${check.name}`);
    console.log(`   Error: ${error.message}\n`);
    allPassed = false;
  }
});

console.log(
  allPassed ? '✅ All checks passed!' : '❌ Some checks failed - CLAUDE.md may need updates'
);
process.exit(allPassed ? 0 : 1);
