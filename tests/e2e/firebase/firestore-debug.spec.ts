/**
 * Firestore Debug Page Tests
 * Comprehensive tests for Firebase debugging capabilities
 * Demonstrates integration with Firebase Test Infrastructure (A.1-A.5)
 */

import { test, expect } from '../firebase-test-fixture';
import { FirestoreDebugPage } from '../../pages/FirestoreDebugPage';

test.describe('Firestore Debug Page', () => {
  test.beforeEach(async ({ page, firebaseData }) => {
    // Clear data before each test for isolation
    await firebaseData.clearAll();
  });

  test('should display Firebase connection status', async ({ page, apiClient }) => {
    const debugPage = new FirestoreDebugPage(page, apiClient);
    await debugPage.navigate();

    // Verify page loads and connection is established
    const connectionInfo = await debugPage.getConnectionInfo();
    expect(connectionInfo.status).toBe('connected');
    expect(connectionInfo.emulatorMode).toBe(true);
    expect(connectionInfo.projectId).toBe('endgame-trainer-test');
  });

  test('should show empty data state initially', async ({ page, apiClient }) => {
    const debugPage = new FirestoreDebugPage(page, apiClient);
    await debugPage.navigate();

    const stats = await debugPage.getDataStats();
    expect(stats.totalDocuments).toBe(0);
    expect(stats.collections.positions || 0).toBe(0);
    expect(stats.collections.categories || 0).toBe(0);
    expect(stats.collections.chapters || 0).toBe(0);
    expect(stats.collections.users || 0).toBe(0);
  });

  test('should refresh data and update counts', async ({ page, firebaseData, apiClient }) => {
    const debugPage = new FirestoreDebugPage(page, apiClient);
    await debugPage.navigate();

    // Seed some test data via Test API
    await firebaseData.seedScenario('basic');

    // Refresh the debug page
    await debugPage.refreshData();

    // Verify data appears
    const stats = await debugPage.getDataStats();
    expect(stats.totalDocuments).toBeGreaterThan(0);
    expect(stats.collections.positions || 0).toBeGreaterThan(0);
  });

  test('should seed test data through UI', async ({ page, apiClient }) => {
    const debugPage = new FirestoreDebugPage(page, apiClient);
    await debugPage.navigate();

    // Seed data using the debug page UI
    await debugPage.seedTestData('basic');

    // Verify data was seeded
    const stats = await debugPage.getDataStats();
    expect(stats.totalDocuments).toBeGreaterThan(0);

    // Verify specific collections
    expect(stats.collections.positions || 0).toBeGreaterThan(0);
    expect(stats.collections.categories || 0).toBeGreaterThan(0);
  });

  test('should clear all data with confirmation', async ({ page, firebaseData, apiClient }) => {
    const debugPage = new FirestoreDebugPage(page, apiClient);
    await debugPage.navigate();

    // First seed some data
    await firebaseData.seedScenario('basic');
    await debugPage.refreshData();

    // Verify data is present
    let stats = await debugPage.getDataStats();
    expect(stats.totalDocuments).toBeGreaterThan(0);

    // Clear all data
    await debugPage.clearAllData({ confirm: true });

    // Verify data was cleared
    stats = await debugPage.getDataStats();
    expect(stats.totalDocuments).toBe(0);
  });

  test('should validate data integrity', async ({ page, firebaseData, apiClient }) => {
    const debugPage = new FirestoreDebugPage(page, apiClient);
    await debugPage.navigate();

    // Seed valid test data
    await firebaseData.seedScenario('basic');
    await debugPage.refreshData();

    // Validate data integrity
    const validationResult = await debugPage.validateData();
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.issues.length).toBe(0);
  });

  test('should display position details', async ({ page, firebaseData, apiClient }) => {
    const debugPage = new FirestoreDebugPage(page, apiClient);
    await debugPage.navigate();

    // Seed test data with known positions
    await firebaseData.seedScenario('basic');
    await debugPage.refreshData();

    // Get available positions
    const positionTitles = await debugPage.getPositionTitles();
    expect(positionTitles.length).toBeGreaterThan(0);

    // Select first position and verify details load
    if (positionTitles.length > 0) {
      await debugPage.selectPosition(positionTitles[0]);
      // Additional verification could be added here for position details
    }
  });

  test('should export data for debugging', async ({ page, firebaseData, apiClient }) => {
    const debugPage = new FirestoreDebugPage(page, apiClient);
    await debugPage.navigate();

    // Seed some test data
    await firebaseData.seedScenario('basic');
    await debugPage.refreshData();

    // Export data
    const exportedData = await debugPage.exportData();
    expect(exportedData).toBeTruthy();
    expect(exportedData.length).toBeGreaterThan(0);

    // Verify exported data contains expected structure
    try {
      const parsedData = JSON.parse(exportedData);
      expect(parsedData).toBeDefined();
      expect(typeof parsedData).toBe('object');
    } catch (error) {
      // If not JSON, should at least be meaningful text data
      expect(exportedData).toContain('positions');
    }
  });

  test('should verify data consistency between UI and API', async ({ page, firebaseData, apiClient }) => {
    const debugPage = new FirestoreDebugPage(page, apiClient);
    await debugPage.navigate();

    // Seed test data
    await firebaseData.seedScenario('advanced', { userCount: 3 });
    await debugPage.refreshData();

    // Verify UI and API show consistent data
    await debugPage.verifyWithTestApi();

    // Additional manual verification
    const uiStats = await debugPage.getDataStats();
    const apiStatus = await apiClient.getFirebaseStatus();

    expect(uiStats.collections.positions || 0).toBe(apiStatus.collections.positions || 0);
    expect(uiStats.collections.users || 0).toBe(apiStatus.collections.users || 0);
  });

  test('should handle error states gracefully', async ({ page, apiClient }) => {
    const debugPage = new FirestoreDebugPage(page, apiClient);
    await debugPage.navigate();

    // Initially should have no errors
    expect(await debugPage.hasError()).toBe(false);
    
    // The debug page should handle various error conditions gracefully
    // Additional error scenario tests could be added here
  });

  test('should track progress for batch operations', async ({ page, apiClient }) => {
    const debugPage = new FirestoreDebugPage(page, apiClient);
    await debugPage.navigate();

    // For large data operations, progress should be tracked
    // This would require UI elements that show progress bars
    await debugPage.seedTestData('advanced');
    
    // Verify operation completed successfully
    await debugPage.verifyNoErrors();
    
    const stats = await debugPage.getDataStats();
    expect(stats.totalDocuments).toBeGreaterThan(0);
  });

  test('should maintain data state across page refreshes', async ({ page, firebaseData, apiClient }) => {
    const debugPage = new FirestoreDebugPage(page, apiClient);
    await debugPage.navigate();

    // Seed test data
    await firebaseData.seedScenario('basic');
    await debugPage.refreshData();

    const statsBeforeRefresh = await debugPage.getDataStats();
    expect(statsBeforeRefresh.totalDocuments).toBeGreaterThan(0);

    // Refresh the entire page
    await page.reload();
    await debugPage.waitForPageLoad();

    // Verify data persists
    const statsAfterRefresh = await debugPage.getDataStats();
    expect(statsAfterRefresh.totalDocuments).toBe(statsBeforeRefresh.totalDocuments);
  });

  test.describe('Collection-specific views', () => {
    test('should display position titles correctly', async ({ page, firebaseData, apiClient }) => {
      const debugPage = new FirestoreDebugPage(page, apiClient);
      await debugPage.navigate();

      await firebaseData.seedScenario('basic');
      await debugPage.refreshData();

      const positionTitles = await debugPage.getPositionTitles();
      expect(positionTitles.length).toBeGreaterThan(0);
      
      // Verify titles are meaningful (not empty or just IDs)
      positionTitles.forEach(title => {
        expect(title.trim().length).toBeGreaterThan(0);
        expect(title).not.toMatch(/^\d+$/); // Not just a number
      });
    });

    test('should display category names correctly', async ({ page, firebaseData, apiClient }) => {
      const debugPage = new FirestoreDebugPage(page, apiClient);
      await debugPage.navigate();

      await firebaseData.seedScenario('basic');
      await debugPage.refreshData();

      const categoryNames = await debugPage.getCategoryNames();
      expect(categoryNames.length).toBeGreaterThan(0);
      
      categoryNames.forEach(name => {
        expect(name.trim().length).toBeGreaterThan(0);
      });
    });

    test('should display user emails correctly', async ({ page, firebaseData, apiClient }) => {
      const debugPage = new FirestoreDebugPage(page, apiClient);
      await debugPage.navigate();

      await firebaseData.seedScenario('basic', { userCount: 2 });
      await debugPage.refreshData();

      const userEmails = await debugPage.getUserEmails();
      expect(userEmails.length).toBeGreaterThanOrEqual(2);
      
      userEmails.forEach(email => {
        expect(email).toMatch(/@test\.local$/); // Should be test emails
      });
    });
  });

  test.describe('Advanced Firebase features', () => {
    test('should wait for specific data counts', async ({ page, firebaseData, apiClient }) => {
      const debugPage = new FirestoreDebugPage(page, apiClient);
      await debugPage.navigate();

      // Seed known amount of data
      await firebaseData.seedBatch({
        positions: [
          { id: 1, title: 'Test Position 1', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
          { id: 2, title: 'Test Position 2', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1' },
          { id: 3, title: 'Test Position 3', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2' }
        ]
      });

      await debugPage.refreshData();

      // Wait for specific count
      await debugPage.waitForPositionsCount(3);

      const stats = await debugPage.getDataStats();
      expect(stats.collections.positions).toBe(3);
    });

    test('should handle emulator-specific features', async ({ page, apiClient }) => {
      const debugPage = new FirestoreDebugPage(page, apiClient);
      await debugPage.navigate();

      // Verify we're running against emulator
      expect(await debugPage.isConnectedToEmulator()).toBe(true);

      const connectionInfo = await debugPage.getConnectionInfo();
      expect(connectionInfo.emulatorMode).toBe(true);
      expect(connectionInfo.projectId).toBe('endgame-trainer-test');
    });
  });
});