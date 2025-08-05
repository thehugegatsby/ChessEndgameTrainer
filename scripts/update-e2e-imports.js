#!/usr/bin/env node

/**
 * Script to update all E2E test files to use custom test fixtures
 * This replaces @playwright/test imports with our custom test-fixtures
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Find all E2E test files
const testFiles = glob.sync("tests/e2e/**/*.spec.ts");

console.log(`Found ${testFiles.length} E2E test files to update`);

let updatedCount = 0;

testFiles.forEach((file) => {
  const filePath = path.resolve(file);
  let content = fs.readFileSync(filePath, "utf8");

  // Calculate relative path from test file to test-fixtures.ts
  const testDir = path.dirname(filePath);
  const fixturesPath = path.resolve("tests/e2e/test-fixtures.ts");
  let relativePath = path.relative(testDir, fixturesPath);

  // Remove .ts extension and ensure it starts with ./
  relativePath = relativePath.replace(/\.ts$/, "");
  if (!relativePath.startsWith(".")) {
    relativePath = "./" + relativePath;
  }

  // Replace the import statement
  const oldImport =
    /import\s*{\s*test\s*,\s*expect\s*}\s*from\s*['"]@playwright\/test['"]/g;
  const newImport = `import { test, expect } from '${relativePath}'`;

  if (content.match(oldImport)) {
    content = content.replace(oldImport, newImport);
    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated: ${file}`);
    updatedCount++;
  } else {
    console.log(`- Skipped: ${file} (no matching import found)`);
  }
});

console.log(`\nUpdate complete! Updated ${updatedCount} files.`);
