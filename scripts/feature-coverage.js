#!/usr/bin/env node

/**
 * Feature Coverage Report Generator
 * Provides detailed coverage metrics for specific features
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FEATURES = {
  evaluation: {
    name: 'Chess Evaluation System',
    files: [
      'shared/utils/chess/evaluationHelpers.ts',
      'shared/services/chess/EngineService.ts',
      'shared/lib/chess/ScenarioEngine/evaluationService.ts',
    ],
    tests: [
      'tests/unit/chess/evaluationHelpers.test.ts',
      'tests/unit/chess/tablebaseEvaluation.test.ts', 
      'tests/unit/chess/engineEvaluation.test.ts',
      'tests/unit/chess/positionEvaluation.test.ts',
    ],
  },
  training: {
    name: 'Training System',
    files: [
      'shared/contexts/TrainingContext.tsx',
      'shared/components/training/TrainingBoard/**/*.tsx',
    ],
    tests: [
      'tests/unit/contexts/TrainingContext.test.tsx',
      'tests/unit/ui/training/**/*.test.tsx',
    ],
  },
};

function runFeatureCoverage(featureName) {
  const feature = FEATURES[featureName];
  if (!feature) {
    console.error(`Unknown feature: ${featureName}`);
    console.log('Available features:', Object.keys(FEATURES).join(', '));
    process.exit(1);
  }

  console.log(`\n📊 Running coverage analysis for: ${feature.name}\n`);

  // Create temporary jest config for this feature
  const tempConfig = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    rootDir: '.',
    collectCoverageFrom: feature.files,
    testMatch: feature.tests.map(t => `<rootDir>/${t}`),
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/shared/$1',
      '^@shared/(.*)$': '<rootDir>/shared/$1',
    },
    transform: {
      '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
    },
  };

  // Write temporary config
  const tempConfigPath = path.join(__dirname, '..', 'jest.config.temp.js');
  fs.writeFileSync(
    tempConfigPath,
    `module.exports = ${JSON.stringify(tempConfig, null, 2)}`
  );

  try {
    // Run Jest with the temporary config
    const output = execSync(
      `npx jest --config="${tempConfigPath}" --coverage --coverageReporters="text" --coverageReporters="json-summary"`,
      { encoding: 'utf8' }
    );
    
    console.log(output);

    // Read coverage summary
    const summaryPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      
      console.log('\n📈 Feature Coverage Summary:');
      console.log('─'.repeat(50));
      
      Object.entries(summary).forEach(([file, data]) => {
        if (file !== 'total') {
          console.log(`\n${path.basename(file)}:`);
          console.log(`  Statements: ${data.statements.pct}%`);
          console.log(`  Branches:   ${data.branches.pct}%`);
          console.log(`  Functions:  ${data.functions.pct}%`);
          console.log(`  Lines:      ${data.lines.pct}%`);
        }
      });
      
      if (summary.total) {
        console.log('\n📊 Total Feature Coverage:');
        console.log('─'.repeat(50));
        console.log(`  Statements: ${summary.total.statements.pct}%`);
        console.log(`  Branches:   ${summary.total.branches.pct}%`);
        console.log(`  Functions:  ${summary.total.functions.pct}%`);
        console.log(`  Lines:      ${summary.total.lines.pct}%`);
      }
    }
  } catch (error) {
    console.error('Coverage analysis failed:', error.message);
  } finally {
    // Clean up temp config
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  }
}

// Main execution
const feature = process.argv[2] || 'evaluation';
runFeatureCoverage(feature);