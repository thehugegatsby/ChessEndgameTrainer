#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectRoot = path.join(__dirname, "..");

// Specific checks for potentially unused services and utilities
const specificChecks = [
  {
    name: "Mobile Services",
    path: "shared/services/mobile",
    description: "Mobile platform services that might not be used in web",
  },
  {
    name: "Platform Services",
    path: "shared/services/platform",
    description: "Platform abstraction services",
  },
  {
    name: "Logging Services",
    path: "shared/services/logging",
    description: "Logging utilities",
  },
  {
    name: "Store (Zustand)",
    path: "shared/store",
    description: "Zustand store (mentioned as unused in CLAUDE.md)",
  },
  {
    name: "Evaluation Services",
    path: "shared/lib/chess/evaluation",
    description: "Chess evaluation services",
  },
  {
    name: "Cache Services",
    path: "shared/lib/cache",
    description: "Caching utilities",
  },
  {
    name: "Training Services",
    path: "shared/lib/training",
    description: "Training utilities",
  },
  {
    name: "Mobile App",
    path: "app/mobile",
    description: "React Native mobile app",
  },
];

function checkServiceUsage(servicePath, serviceName) {
  const fullPath = path.join(projectRoot, servicePath);

  if (!fs.existsSync(fullPath)) {
    return { exists: false };
  }

  const files = [];

  // Get all files in the service directory
  function getAllFiles(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory() && !item.includes("test")) {
        getAllFiles(itemPath);
      } else if (
        (item.endsWith(".ts") || item.endsWith(".tsx")) &&
        !item.includes(".test.")
      ) {
        files.push({
          name: item,
          path: itemPath,
          relativePath: path.relative(projectRoot, itemPath),
        });
      }
    }
  }

  getAllFiles(fullPath);

  // Check usage of each file
  const usageReport = files.map((file) => {
    const fileName = path.basename(file.name, path.extname(file.name));

    try {
      // Search for imports of this file
      const importSearch = execSync(
        `grep -r --include="*.ts" --include="*.tsx" -l "${fileName}" "${projectRoot}" 2>/dev/null | grep -v "${file.relativePath}" | grep -v test || true`,
        { encoding: "utf8", maxBuffer: 1024 * 1024 * 10 },
      );

      const importingFiles = importSearch
        .trim()
        .split("\n")
        .filter((f) => f);

      return {
        file: file.relativePath,
        used: importingFiles.length > 0,
        importedBy: importingFiles.map((f) => path.relative(projectRoot, f)),
      };
    } catch (error) {
      return {
        file: file.relativePath,
        used: false,
        importedBy: [],
      };
    }
  });

  return {
    exists: true,
    totalFiles: files.length,
    usedFiles: usageReport.filter((r) => r.used).length,
    unusedFiles: usageReport.filter((r) => !r.used),
    usageReport,
  };
}

// Check for components that might be unused
function checkUnusedComponents() {
  console.log("\n## Checking specific components for usage...\n");

  const componentsToCheck = [
    "DarkModeToggle",
    "ProgressCard",
    "Toast",
    "ErrorBoundary",
    "EngineErrorBoundary",
    "WikiPanel",
    "AnalysisPanel",
    "MoveHistory",
    "EvaluationLegend",
    "TrainingControls",
    "MovePanel",
    "BestMovesDisplay",
    "SidebarEngineSection",
  ];

  const unusedComponents = [];

  for (const component of componentsToCheck) {
    try {
      const usage = execSync(
        `grep -r --include="*.ts" --include="*.tsx" -l "${component}" "${projectRoot}" 2>/dev/null | grep -v "${component}.tsx" | grep -v test || true`,
        { encoding: "utf8" },
      );

      const usageCount = usage
        .trim()
        .split("\n")
        .filter((l) => l).length;

      if (usageCount === 0) {
        unusedComponents.push(component);
      }

      console.log(`- ${component}: ${usageCount} usages`);
    } catch (error) {
      console.log(`- ${component}: Error checking usage`);
    }
  }

  return unusedComponents;
}

// Main analysis
console.log("=== UNUSED SERVICES AND COMPONENTS ANALYSIS ===\n");

const report = {
  services: [],
  components: [],
  summary: {
    totalServicesChecked: 0,
    unusedServices: 0,
    totalFilesChecked: 0,
    unusedFiles: 0,
  },
};

// Check each service
for (const check of specificChecks) {
  console.log(`\n## ${check.name} (${check.path})`);
  console.log(`Description: ${check.description}\n`);

  const result = checkServiceUsage(check.path, check.name);

  if (!result.exists) {
    console.log("Directory does not exist.");
    continue;
  }

  report.services.push({
    name: check.name,
    path: check.path,
    ...result,
  });

  report.summary.totalServicesChecked++;
  report.summary.totalFilesChecked += result.totalFiles;
  report.summary.unusedFiles += result.unusedFiles.length;

  console.log(`Total files: ${result.totalFiles}`);
  console.log(`Used files: ${result.usedFiles}`);
  console.log(`Unused files: ${result.unusedFiles.length}`);

  if (result.unusedFiles.length > 0) {
    console.log("\nUnused files:");
    result.unusedFiles.forEach((file) => {
      console.log(`  - ${file.file}`);
    });
  }

  if (result.usedFiles === 0 && result.totalFiles > 0) {
    report.summary.unusedServices++;
    console.log("\n⚠️  This entire service appears to be unused!");
  }
}

// Check components
const unusedComponents = checkUnusedComponents();
report.components = unusedComponents;

// Generate detailed markdown report
let markdown = "# Unused Services and Components Report\n\n";
markdown += `Generated on: ${new Date().toISOString()}\n\n`;
markdown += "## Summary\n\n";
markdown += `- Services checked: ${report.summary.totalServicesChecked}\n`;
markdown += `- Completely unused services: ${report.summary.unusedServices}\n`;
markdown += `- Total files checked: ${report.summary.totalFilesChecked}\n`;
markdown += `- Unused files: ${report.summary.unusedFiles}\n`;
markdown += `- Potentially unused components: ${report.components.length}\n\n`;

markdown += "## Detailed Service Analysis\n\n";

for (const service of report.services) {
  markdown += `### ${service.name}\n`;
  markdown += `Path: \`${service.path}\`\n\n`;
  markdown += `- Total files: ${service.totalFiles}\n`;
  markdown += `- Used files: ${service.usedFiles}\n`;
  markdown += `- Unused files: ${service.unusedFiles.length}\n\n`;

  if (service.unusedFiles.length > 0) {
    markdown += "#### Unused files:\n";
    service.unusedFiles.forEach((file) => {
      markdown += `- \`${file.file}\`\n`;
    });
    markdown += "\n";
  }

  if (service.usedFiles === 0 && service.totalFiles > 0) {
    markdown += "**⚠️ This entire service appears to be unused!**\n\n";
  }
}

if (report.components.length > 0) {
  markdown += "## Potentially Unused Components\n\n";
  report.components.forEach((comp) => {
    markdown += `- ${comp}\n`;
  });
}

// Check for migration artifacts
markdown += "\n## Migration Artifacts\n\n";
const migrationFiles = execSync(
  `find "${projectRoot}" -name "*.migration.*" -o -name "*.old.*" -o -name "*.backup.*" 2>/dev/null || true`,
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter((f) => f);

if (migrationFiles.length > 0) {
  markdown += "Found migration/backup files:\n";
  migrationFiles.forEach((file) => {
    markdown += `- \`${path.relative(projectRoot, file)}\`\n`;
  });
} else {
  markdown += "No migration artifacts found.\n";
}

const reportPath = path.join(projectRoot, "UNUSED_SERVICES_REPORT.md");
fs.writeFileSync(reportPath, markdown);

console.log(`\n\nDetailed report written to: ${reportPath}`);

// Summary
console.log("\n=== SUMMARY ===\n");
console.log(`🔴 Completely unused services: ${report.summary.unusedServices}`);
console.log(
  `🟡 Services with unused files: ${report.services.filter((s) => s.unusedFiles.length > 0).length}`,
);
console.log(`🔵 Total unused files: ${report.summary.unusedFiles}`);
console.log(`🟣 Potentially unused components: ${report.components.length}`);
