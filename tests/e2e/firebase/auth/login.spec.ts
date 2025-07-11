/**
 * Firebase Auth Integration Tests
 * Tests authentication flow with Firebase Auth Emulator
 */

import { test, expect } from '../fixtures/firebase-fixtures';
import { LoginPage } from '../../../pages/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage';
import { doc, getDoc } from 'firebase/firestore';

test.describe('Firebase Authentication', () => {
  test('should create user and login successfully', async ({ page, testUser, firebaseEnv, testApiClient }) => {
    // User is already created by testUser fixture
    
    // Navigate to login page
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    
    // Perform login
    await loginPage.fillEmail(testUser.email);
    await loginPage.fillPassword(testUser.password);
    await loginPage.submit();
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForPageLoad();
    
    // Verify user is logged in
    const userEmail = await dashboardPage.getUserEmail();
    expect(userEmail).toBe(testUser.email);
    
    // Verify user profile exists in Firestore
    const userDoc = await getDoc(doc(firebaseEnv.db, 'users', testUser.uid));
    expect(userDoc.exists()).toBe(true);
    expect(userDoc.data()?.email).toBe(testUser.email);
  });

  test('should handle invalid credentials', async ({ page, testApiClient }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    
    // Try to login with invalid credentials
    await loginPage.fillEmail('invalid@example.com');
    await loginPage.fillPassword('wrongpassword');
    await loginPage.submit();
    
    // Should show error message
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Invalid credentials');
    
    // Should not redirect
    expect(page.url()).toContain('/login');
  });

  test('should persist auth state across page reloads', async ({ page, testUser, testApiClient }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.fillEmail(testUser.email);
    await loginPage.fillPassword(testUser.password);
    await loginPage.submit();
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    
    // Reload page
    await page.reload();
    
    // Should still be on dashboard
    expect(page.url()).toContain('/dashboard');
    
    // User should still be logged in
    const dashboardPage = new DashboardPage(page);
    const userEmail = await dashboardPage.getUserEmail();
    expect(userEmail).toBe(testUser.email);
  });

  test('should logout successfully', async ({ page, testUser }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.fillEmail(testUser.email);
    await loginPage.fillPassword(testUser.password);
    await loginPage.submit();
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    const dashboardPage = new DashboardPage(page);
    
    // Perform logout
    await dashboardPage.logout();
    
    // Should redirect to login
    await page.waitForURL('**/login');
    
    // Try to access dashboard directly
    await page.goto('/dashboard');
    
    // Should redirect back to login
    await page.waitForURL('**/login');
  });
});

test.describe('Firebase Data Isolation', () => {
  test('should not see data from previous tests', async ({ firebaseEnv, testUser }) => {
    // This test verifies that clearFirestore() works properly
    
    // Check users collection
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    const usersQuery = query(
      collection(firebaseEnv.db, 'users'),
      where('email', '!=', testUser.email)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    // Should only have the current test user
    expect(usersSnapshot.size).toBe(0);
    
    // Check positions collection
    const positionsSnapshot = await getDocs(collection(firebaseEnv.db, 'positions'));
    
    // Should only have seeded test data (3 positions)
    expect(positionsSnapshot.size).toBe(3);
  });
});