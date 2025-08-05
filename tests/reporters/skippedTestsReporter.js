/**
 * Custom Jest Reporter for tracking skipped tests
 * This reporter helps ensure that skipped tests don't accumulate unnoticed
 */

class SkippedTestsReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.skippedTests = [];
  }

  onTestResult(test, testResult) {
    // Collect skipped tests
    testResult.testResults.forEach((result) => {
      if (result.status === "pending" || result.status === "skipped") {
        this.skippedTests.push({
          file: test.path.replace(process.cwd(), ""),
          title: result.title,
          fullName: result.fullName,
          ancestorTitles: result.ancestorTitles,
        });
      }
    });
  }

  onRunComplete(contexts, results) {
    if (this.skippedTests.length === 0) {
      console.log("\n✅ No skipped tests found.");
      return;
    }

    console.log("\n⚠️  Skipped Tests Summary:");
    console.log("========================");
    console.log(`Total skipped tests: ${this.skippedTests.length}\n`);

    // Group by file
    const byFile = {};
    this.skippedTests.forEach((test) => {
      if (!byFile[test.file]) {
        byFile[test.file] = [];
      }
      byFile[test.file].push(test);
    });

    // Display grouped results
    Object.entries(byFile).forEach(([file, tests]) => {
      console.log(`📁 ${file}`);
      tests.forEach((test) => {
        const describe = test.ancestorTitles.join(" > ");
        console.log(`   ⏭️  ${describe} > ${test.title}`);
      });
      console.log("");
    });

    // Check for TODO comments in skipped tests
    const testsWithoutTodos = this.skippedTests.filter((test) => {
      // In a real implementation, we'd read the test file and check for TODO comments
      // For now, we'll just remind to add them
      return true;
    });

    if (testsWithoutTodos.length > 0) {
      console.log(
        "💡 Reminder: Add TODO comments with issue tracking links to all skipped tests.",
      );
    }

    // Optional: Fail the build if too many tests are skipped
    const threshold = this._options.maxSkippedTests || 10;
    if (this.skippedTests.length > threshold) {
      console.log(
        `\n❌ ERROR: Number of skipped tests (${this.skippedTests.length}) exceeds threshold (${threshold})`,
      );
      console.log(
        "   Please implement the missing features or adjust the threshold.\n",
      );
    }
  }
}

module.exports = SkippedTestsReporter;
