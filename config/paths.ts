/**
 * Centralized Path Configuration - Single Source of Truth
 *
 * 🤖 AI-NOTE: ALL config files must import paths from here
 * 🤖 AI-RULE: Never use relative paths (../) in config files
 * 🤖 AI-RULE: Always add new paths here first, then import in configs
 *
 * PURPOSE: Absolute path constants for all configuration files
 * PATTERN: Pure constants only - no side effects, no logic
 */

import { resolve } from 'node:path';

// Project structure constants
export const projectRoot = resolve(__dirname, '..');
export const srcDir = resolve(projectRoot, 'src');
export const configDir = resolve(projectRoot, 'config');

// Source directories
export const appDir = resolve(srcDir, 'app');
export const sharedDir = resolve(srcDir, 'shared');
export const featuresDir = resolve(srcDir, 'features');
export const domainsDir = resolve(srcDir, 'domains');

// Test directories
export const testsDir = resolve(srcDir, 'tests');
export const unitTestsDir = resolve(testsDir, 'unit');
export const integrationTestsDir = resolve(testsDir, 'integration');
export const e2eTestsDir = resolve(testsDir, 'e2e');
export const e2eFirebaseDir = resolve(e2eTestsDir, 'firebase');

// Build and output directories
export const nextDir = resolve(projectRoot, '.next');
export const coverageDir = resolve(projectRoot, 'coverage');
export const testResultsDir = resolve(projectRoot, 'test-results');
export const jestCacheDir = resolve(projectRoot, '.jest-cache');

// Mock directories
export const testsSharedDir = resolve(testsDir, 'shared');
export const testsMocksDir = resolve(testsDir, '__mocks__');

// Config directories
export const testingConfigDir = resolve(configDir, 'testing');
export const lintingConfigDir = resolve(configDir, 'linting');

// Common file patterns for reuse
export const testSetupFile = resolve(testingConfigDir, 'vitest.setup.ts');
export const integrationSetupFile = resolve(testingConfigDir, 'vitest.setup.integration.ts');
export const featuresTestSetup = resolve(featuresDir, 'test-setup.ts');

// Mock file paths
export const fileMock = resolve(testsMocksDir, 'fileMock.js');
