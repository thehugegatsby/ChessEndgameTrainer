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

  /**
   * Called after each test file completes
   * @param test - Test configuration
   * @param testResult - Test results
   */
  onTestResult(test, testResult) {
    // Collect skipped tests
    testResult.testResults.forEach(result => {
      if (result.status === 'pending' || result.status === 'skipped') {
        this.skippedTests.push({
          file: test.path.replace(process.cwd(), ''),
          title: result.title,
          fullName: result.fullName,
          ancestorTitles: result.ancestorTitles,
        });
      }
    });
  }

  /**
   * Called when all tests have completed
   * @param contexts - Test contexts
   * @param results - Aggregated results
   */
  onRunComplete(contexts, results) {
    if (this.skippedTests.length === 0) {
      // Silent return when no skipped tests
      return;
    }

    // Store skipped test data for potential reporting
    // Actual output should be handled by the test runner's built-in reporting
    const skippedTestsData = {
      total: this.skippedTests.length,
      byFile: {},
      threshold: this._options.maxSkippedTests || 10,
    };

    // Group by file
    this.skippedTests.forEach(test => {
      if (!skippedTestsData.byFile[test.file]) {
        skippedTestsData.byFile[test.file] = [];
      }
      skippedTestsData.byFile[test.file].push(test);
    });

    // Store the data for potential use by other tools
    // The data could be written to a JSON file or sent to a logging service
    if (this._globalConfig.outputFile) {
      // Would write to file if configured
    }

    // Return early if threshold is exceeded (test runner will handle the error)
    if (this.skippedTests.length > skippedTestsData.threshold) {
      throw new Error(
        `Number of skipped tests (${this.skippedTests.length}) exceeds threshold (${skippedTestsData.threshold})`
      );
    }
  }
}

module.exports = SkippedTestsReporter;
