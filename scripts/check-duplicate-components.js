#!/usr/bin/env node

/**
 * Detects duplicate component names that could cause import confusion
 */

const fs = require("fs");
const path = require("path");

function findComponents(dir, components = new Map()) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Check if directory has index.tsx (it's a component)
      const indexPath = path.join(fullPath, "index.tsx");
      if (fs.existsSync(indexPath)) {
        const componentName = file;
        if (!components.has(componentName)) {
          components.set(componentName, []);
        }
        components.get(componentName).push(`${fullPath}/ (folder)`);
      }

      // Recurse into subdirectories
      findComponents(fullPath, components);
    } else if (
      file.endsWith(".tsx") &&
      !file.includes(".test.") &&
      !file.includes(".spec.") &&
      file !== "index.tsx"
    ) {
      // Check standalone .tsx files (but skip index.tsx files)
      const componentName = file.replace(".tsx", "");
      if (!components.has(componentName)) {
        components.set(componentName, []);
      }
      components.get(componentName).push(`${fullPath} (file)`);
    }
  }

  return components;
}

function main() {
  console.log("🔍 Checking for duplicate component names...\n");

  const components = findComponents("./shared/components");
  const duplicates = Array.from(components.entries()).filter(
    ([name, paths]) => paths.length > 1,
  );

  if (duplicates.length === 0) {
    console.log("✅ No duplicate component names found!");
    process.exit(0);
  }

  console.log("🚨 DUPLICATE COMPONENT NAMES DETECTED:");
  console.log("=====================================\n");

  for (const [name, paths] of duplicates) {
    console.log(`❌ Component "${name}" exists in multiple locations:`);
    paths.forEach((p) => console.log(`   - ${p}`));
    console.log();
  }

  console.log("💡 SOLUTION:");
  console.log("   1. Choose ONE location as the canonical version");
  console.log("   2. Delete the other versions");
  console.log("   3. Update all imports to use the canonical version");
  console.log("   4. Run this script again to verify\n");

  process.exit(1);
}

main();
