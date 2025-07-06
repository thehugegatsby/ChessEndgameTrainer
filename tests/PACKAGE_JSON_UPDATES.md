# Package.json Script Updates

## Neue Test-Scripts hinzufügen:

```json
{
  "scripts": {
    // Bestehende Scripts beibehalten
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    
    // NEUE Scripts für strukturierte Tests
    "test:unit": "jest --selectProjects=unit",
    "test:unit:watch": "jest --selectProjects=unit --watch",
    "test:unit:coverage": "jest --selectProjects=unit --coverage",
    
    "test:integration": "jest --selectProjects=integration",
    "test:integration:watch": "jest --selectProjects=integration --watch",
    
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    
    // Spezielle Test-Gruppen
    "test:evaluation": "jest --testPathPattern='evaluation' --verbose",
    "test:engine": "jest --testPathPattern='engine|worker' --verbose",
    "test:critical": "npm run test:evaluation && npm run test:engine",
    
    // CI/CD optimierte Scripts
    "test:ci:unit": "jest --selectProjects=unit --ci --coverage --maxWorkers=4",
    "test:ci:integration": "jest --selectProjects=integration --ci --maxWorkers=2",
    "test:ci:all": "npm run test:ci:unit && npm run test:ci:integration",
    
    // Entwickler-Helfer
    "test:changed": "jest -o",
    "test:related": "jest --findRelatedTests",
    "test:debug": "node --inspect-brk ./node_modules/.bin/jest --runInBand"
  }
}
```

## Jest Config Update:

```javascript
// jest.config.js
module.exports = {
  // Verweis auf neue Config
  projects: [
    '<rootDir>/jest.config.tests.js',
    // Legacy support während Migration
    '<rootDir>/jest.config.legacy.js'
  ]
};
```

## Pre-Commit Hook (optional):

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:changed"
    }
  }
}
```