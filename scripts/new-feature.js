#!/usr/bin/env node

/**
 * Feature Scaffold Generator
 * Creates new feature directories with standard structure
 * Usage: pnpm run new-feature <feature-name>
 */

const fs = require('fs');
const path = require('path');

const featureName = process.argv[2];

if (!featureName) {
  console.error('❌ Error: Feature name is required');
  console.log('Usage: pnpm run new-feature <feature-name>');
  process.exit(1);
}

// Validate feature name
if (!/^[a-z-]+$/.test(featureName)) {
  console.error('❌ Error: Feature name must be lowercase with hyphens only');
  process.exit(1);
}

const featureDir = path.join(__dirname, '..', 'src', 'features', featureName);

// Check if feature already exists
if (fs.existsSync(featureDir)) {
  console.error(`❌ Error: Feature '${featureName}' already exists`);
  process.exit(1);
}

// Create feature directory structure
const directories = [
  '',
  'components',
  'components/__tests__',
  'hooks',
  'hooks/__tests__',
  'services',
  'services/__tests__',
  'store',
  'store/__tests__',
  'types',
  'utils',
  'utils/__tests__',
  '__tests__',
];

const pascalName = featureName
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');

const camelName = featureName
  .split('-')
  .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
  .join('');

console.log(`🚀 Creating feature: ${featureName}`);

// Create directories
directories.forEach(dir => {
  const dirPath = path.join(featureDir, dir);
  fs.mkdirSync(dirPath, { recursive: true });
});

// Create index.ts (barrel file)
const indexContent = `/**
 * ${pascalName} Feature - Public API
 * 
 * This barrel file exports all public components, hooks, services, and types
 * from the ${featureName} feature module.
 */

// Components
// export { ${pascalName}Component } from './components/${pascalName}Component';

// Hooks
// export { use${pascalName} } from './hooks/use${pascalName}';

// Services
// export { ${pascalName}Service } from './services/${pascalName}Service';

// Types
// export type { 
//   ${pascalName}State,
//   ${pascalName}Actions
// } from './types/${featureName}.types';

// Store
// export { use${pascalName}Store } from './store/${camelName}Store';
`;

fs.writeFileSync(path.join(featureDir, 'index.ts'), indexContent);

// Create basic test file
const testContent = `import { describe, it } from 'vitest';

describe('${featureName} feature', () => {
  it.todo('should implement core functionality');
  it.todo('should handle edge cases');
  it.todo('should integrate with other features');
});
`;

fs.writeFileSync(path.join(featureDir, '__tests__', `${featureName}.test.ts`), testContent);

// Create types file
const typesContent = `/**
 * ${pascalName} Feature Types
 */

export interface ${pascalName}State {
  // Define state interface
}

export interface ${pascalName}Actions {
  // Define actions interface
}
`;

fs.writeFileSync(path.join(featureDir, 'types', `${featureName}.types.ts`), typesContent);

console.log('✅ Feature created successfully!');
console.log(`📁 Location: src/features/${featureName}/`);
console.log('\n📝 Next steps:');
console.log(`1. Implement your feature in src/features/${featureName}/`);
console.log(`2. Add tests to src/features/${featureName}/__tests__/`);
console.log(`3. Export public API in src/features/${featureName}/index.ts`);
console.log(`4. Run tests: pnpm test ${featureName}`);
