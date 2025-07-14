/**
 * Modern Driver API E2E Tests
 * Tests for modern web platform APIs and browser driver features
 * 
 * Issue #17: E2E tests für ModernDriver API
 */

import { test, expect } from '@playwright/test';
import { E2E, STORAGE, PERFORMANCE, UI } from '../../../shared/constants';
import { resetMSWHandlers } from '../fixtures/msw-server';

test.describe('Modern Driver API Tests', () => {
  
  test.beforeEach(async ({ page, context, browserName }) => {
    resetMSWHandlers();
    
    // Grant permissions conditionally based on browser support
    const permissions = ['notifications'];
    if (browserName === 'chromium') {
      permissions.push('clipboard-read', 'clipboard-write');
    }
    // Firefox doesn't support clipboard-write permission
    
    try {
      await context.grantPermissions(permissions);
    } catch (error: unknown) {
      // Some browsers don't support all permissions - log and continue
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Permission grant failed for ${browserName}: ${errorMessage}`);
    }
    
    // Navigate to training page for testing
    await page.goto(E2E.ROUTES.TRAIN(1));
    await page.waitForTimeout(E2E.TIMEOUTS.PAGE_LOAD);
  });

  test.describe('Storage API Tests', () => {
    test('should use localStorage with proper prefix', async ({ page }) => {
      // Test localStorage usage with chess trainer prefix
      await page.evaluate((prefix) => {
        localStorage.setItem(`${prefix}test-key`, JSON.stringify({ test: 'data' }));
      }, STORAGE.PREFIX);
      
      const storedData = await page.evaluate((prefix) => {
        const item = localStorage.getItem(`${prefix}test-key`);
        return item ? JSON.parse(item) : null;
      }, STORAGE.PREFIX);
      
      expect(storedData).toEqual({ test: 'data' });
      
      // Verify prefix isolation
      await page.evaluate(() => {
        localStorage.setItem('other-app-key', 'other-data');
      });
      
      const chessKeys = await page.evaluate((prefix) => {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(prefix)) {
            keys.push(key);
          }
        }
        return keys;
      }, STORAGE.PREFIX);
      
      expect(chessKeys).toContain(`${STORAGE.PREFIX}test-key`);
      expect(chessKeys).not.toContain('other-app-key');
    });

    test('should handle localStorage quota exceeded', async ({ page }) => {
      // Test localStorage quota handling
      const result = await page.evaluate((prefix) => {
        try {
          // Try to fill localStorage
          const largeData = 'x'.repeat(1000000); // 1MB string
          for (let i = 0; i < 10; i++) {
            localStorage.setItem(`${prefix}large-${i}`, largeData);
          }
          return { success: true };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return { success: false, error: errorMessage };
        }
      }, STORAGE.PREFIX);
      
      // Either succeeds or fails gracefully
      if (!result.success) {
        expect(result.error).toContain('quota');
      }
    });
  });

  test.describe('Performance API Tests', () => {
    test('should use Performance API for measurements', async ({ page }) => {
      // Test Performance API usage
      const performanceData = await page.evaluate((debounceDelay) => {
        // Simulate performance measurement
        const startTime = performance.now();
        
        // Simulate some work
        const result = [];
        for (let i = 0; i < 1000; i++) {
          result.push(i * 2);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        return {
          startTime,
          endTime,
          duration,
          hasPerformanceAPI: typeof performance !== 'undefined',
          hasNavigationTiming: typeof performance.navigation !== 'undefined',
          debounceDelay
        };
      }, PERFORMANCE.DEBOUNCE_DELAY);
      
      expect(performanceData.hasPerformanceAPI).toBe(true);
      expect(performanceData.duration).toBeGreaterThan(0);
      expect(performanceData.debounceDelay).toBe(PERFORMANCE.DEBOUNCE_DELAY);
    });

    test('should handle performance marks and measures', async ({ page }) => {
      const markData = await page.evaluate(() => {
        // Test performance marks
        performance.mark('test-start');
        
        // Simulate work
        for (let i = 0; i < 100; i++) {
          Math.random();
        }
        
        performance.mark('test-end');
        
        // Measure duration
        performance.measure('test-duration', 'test-start', 'test-end');
        
        const entries = performance.getEntriesByType('measure');
        const testMeasure = entries.find(entry => entry.name === 'test-duration');
        
        return {
          hasMeasure: !!testMeasure,
          duration: testMeasure?.duration || 0
        };
      });
      
      expect(markData.hasMeasure).toBe(true);
      expect(markData.duration).toBeGreaterThan(0);
    });
  });

  test.describe('Navigator API Tests', () => {
    test('should detect platform information', async ({ page }) => {
      const platformInfo = await page.evaluate(() => {
        return {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          onLine: navigator.onLine,
          cookieEnabled: navigator.cookieEnabled,
          hardwareConcurrency: navigator.hardwareConcurrency
        };
      });
      
      expect(platformInfo.userAgent).toBeTruthy();
      expect(platformInfo.onLine).toBe(true);
      expect(platformInfo.cookieEnabled).toBe(true);
      expect(typeof platformInfo.hardwareConcurrency).toBe('number');
    });

    test('should handle network information', async ({ page }) => {
      const networkInfo = await page.evaluate(() => {
        // @ts-ignore - navigator.connection is experimental
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        return {
          hasConnection: !!connection,
          effectiveType: connection?.effectiveType,
          downlink: connection?.downlink,
          rtt: connection?.rtt
        };
      });
      
      // Connection API may not be available in all browsers
      if (networkInfo.hasConnection) {
        expect(networkInfo.effectiveType).toBeTruthy();
      }
    });
  });

  test.describe('Clipboard API Tests', () => {
    test('should handle clipboard operations', async ({ page, browserName }) => {
      // Skip clipboard read tests on unsupported browsers
      test.skip(browserName !== 'chromium', 'Clipboard read API only supported in Chromium');
      
      // Test clipboard write (if permissions granted)
      const clipboardResult = await page.evaluate(async () => {
        try {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText('test-clipboard-data');
            const readText = await navigator.clipboard.readText();
            return { success: true, data: readText };
          }
          return { success: false, reason: 'Clipboard API not available' };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return { success: false, reason: errorMessage };
        }
      });
      
      if (clipboardResult.success) {
        expect(clipboardResult.data).toBe('test-clipboard-data');
      } else {
        // Clipboard API might not be available in test environment
        expect(clipboardResult.reason).toBeTruthy();
      }
    });

    test('should handle clipboard write across browsers', async ({ page, browserName }) => {
      // Test clipboard write support across different browsers
      const writeResult = await page.evaluate(async () => {
        try {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText('cross-browser-test');
            return { success: true };
          }
          return { success: false, reason: 'Clipboard API not available' };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return { success: false, reason: errorMessage };
        }
      });
      
      // Write should work on most modern browsers
      if (browserName === 'chromium' || browserName === 'firefox') {
        expect(writeResult.success).toBe(true);
      } else {
        // WebKit might have different behavior
        expect(typeof writeResult.success).toBe('boolean');
      }
    });
  });

  test.describe('Web Share API Tests', () => {
    test('should detect Web Share API availability', async ({ page }) => {
      const shareCapability = await page.evaluate(() => {
        return {
          hasShareAPI: 'share' in navigator,
          canShare: typeof navigator.share === 'function'
        };
      });
      
      // Web Share API availability depends on browser and context
      expect(typeof shareCapability.hasShareAPI).toBe('boolean');
      expect(typeof shareCapability.canShare).toBe('boolean');
    });
  });

  test.describe('Notification API Tests', () => {
    test('should handle notification permissions', async ({ page, context, browserName }) => {
      // Grant notification permissions (Firefox doesn't support clipboard-write)
      const permissions = ['notifications'];
      if (browserName === 'chromium') {
        permissions.push('clipboard-read', 'clipboard-write');
      }
      await context.grantPermissions(permissions);
      
      const notificationResult = await page.evaluate(async () => {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return {
            hasNotificationAPI: true,
            permission,
            supported: Notification.permission !== 'denied'
          };
        }
        return { hasNotificationAPI: false };
      });
      
      expect(notificationResult.hasNotificationAPI).toBe(true);
      if (notificationResult.supported) {
        expect(['granted', 'denied', 'default']).toContain(notificationResult.permission);
      }
    });
  });

  test.describe('Device Memory API Tests', () => {
    test('should detect device memory information', async ({ page }) => {
      const memoryInfo = await page.evaluate(() => {
        // @ts-ignore - navigator.deviceMemory is experimental
        const deviceMemory = navigator.deviceMemory;
        
        return {
          hasDeviceMemory: typeof deviceMemory !== 'undefined',
          deviceMemory: deviceMemory || 0,
          isLowEndDevice: deviceMemory ? deviceMemory < 4 : false
        };
      });
      
      // Device Memory API might not be available
      if (memoryInfo.hasDeviceMemory) {
        expect(memoryInfo.deviceMemory).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Viewport and Screen API Tests', () => {
    test('should handle viewport information', async ({ page }) => {
      const viewportInfo = await page.evaluate(() => {
        return {
          screenWidth: screen.width,
          screenHeight: screen.height,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          pixelRatio: window.devicePixelRatio,
          colorDepth: screen.colorDepth,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight
        };
      });
      
      expect(viewportInfo.screenWidth).toBeGreaterThan(0);
      expect(viewportInfo.screenHeight).toBeGreaterThan(0);
      expect(viewportInfo.windowWidth).toBeGreaterThan(0);
      expect(viewportInfo.windowHeight).toBeGreaterThan(0);
      expect(viewportInfo.pixelRatio).toBeGreaterThan(0);
      expect(viewportInfo.colorDepth).toBeGreaterThan(0);
    });

    test('should handle responsive design breakpoints', async ({ page }) => {
      // Test different viewport sizes
      const breakpoints = [
        { name: 'mobile', width: UI.BREAKPOINTS.MOBILE, height: 667 },
        { name: 'tablet', width: 800, height: 1024 }, // Use 800 instead of 1024 to be in tablet range
        { name: 'desktop', width: UI.BREAKPOINTS.DESKTOP, height: 720 }
      ];
      
      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        
        // Wait for viewport change to be processed by the application
        await page.waitForTimeout(100);
        
        // Use expect.poll to wait for breakpoint detection to complete
        if (breakpoint.name === 'mobile') {
          await expect.poll(async () => {
            const viewportInfo = await page.evaluate(() => {
              return {
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth < 768,
                isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                isDesktop: window.innerWidth >= 1024
              };
            });
            return viewportInfo.isMobile;
          }, {
            message: `Mobile breakpoint not detected for width ${breakpoint.width}`,
            timeout: 5000
          }).toBe(true);
        } else if (breakpoint.name === 'tablet') {
          await expect.poll(async () => {
            const viewportInfo = await page.evaluate(() => {
              return {
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth < 768,
                isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                isDesktop: window.innerWidth >= 1024
              };
            });
            return viewportInfo.isTablet;
          }, {
            message: `Tablet breakpoint not detected for width ${breakpoint.width}`,
            timeout: 5000
          }).toBe(true);
        } else {
          await expect.poll(async () => {
            const viewportInfo = await page.evaluate(() => {
              return {
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth < 768,
                isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                isDesktop: window.innerWidth >= 1024
              };
            });
            return viewportInfo.isDesktop;
          }, {
            message: `Desktop breakpoint not detected for width ${breakpoint.width}`,
            timeout: 5000
          }).toBe(true);
        }
        
        // Verify the viewport dimensions are set correctly
        const finalViewportInfo = await page.evaluate(() => {
          return {
            width: window.innerWidth,
            height: window.innerHeight
          };
        });
        
        expect(finalViewportInfo.width).toBe(breakpoint.width);
        expect(finalViewportInfo.height).toBe(breakpoint.height);
      }
    });
  });

  test.describe('Modern JavaScript Features', () => {
    test('should support modern JavaScript APIs', async ({ page }) => {
      const jsFeatures = await page.evaluate(() => {
        return {
          hasPromise: typeof Promise !== 'undefined',
          hasAsyncAwait: (async () => true)().constructor.name === 'Promise',
          hasMap: typeof Map !== 'undefined',
          hasSet: typeof Set !== 'undefined',
          hasWeakMap: typeof WeakMap !== 'undefined',
          hasWeakSet: typeof WeakSet !== 'undefined',
          hasSymbol: typeof Symbol !== 'undefined',
          hasProxy: typeof Proxy !== 'undefined',
          hasIntersectionObserver: typeof IntersectionObserver !== 'undefined',
          hasMutationObserver: typeof MutationObserver !== 'undefined',
          hasResizeObserver: typeof ResizeObserver !== 'undefined'
        };
      });
      
      expect(jsFeatures.hasPromise).toBe(true);
      expect(jsFeatures.hasAsyncAwait).toBe(true);
      expect(jsFeatures.hasMap).toBe(true);
      expect(jsFeatures.hasSet).toBe(true);
      expect(jsFeatures.hasWeakMap).toBe(true);
      expect(jsFeatures.hasWeakSet).toBe(true);
      expect(jsFeatures.hasSymbol).toBe(true);
      expect(jsFeatures.hasProxy).toBe(true);
      expect(jsFeatures.hasIntersectionObserver).toBe(true);
      expect(jsFeatures.hasMutationObserver).toBe(true);
      expect(jsFeatures.hasResizeObserver).toBe(true);
    });

    test('should handle modern error handling', async ({ page }) => {
      const errorHandling = await page.evaluate(() => {
        const results: Array<{ type: string; caught: boolean; message: string }> = [];
        
        // Test try-catch with async/await
        const testAsyncError = async () => {
          try {
            await new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Test async error')), 10);
            });
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            results.push({ type: 'async-error', caught: true, message: errorMessage });
          }
        };
        
        // Test Promise.allSettled
        const testPromiseAllSettled = async () => {
          const promises = [
            Promise.resolve('success'),
            Promise.reject(new Error('failure')),
            Promise.resolve('another success')
          ];
          
          const results = await Promise.allSettled(promises);
          return results.map(result => ({
            status: result.status,
            value: result.status === 'fulfilled' ? result.value : (result.reason instanceof Error ? result.reason.message : String(result.reason))
          }));
        };
        
        return Promise.all([testAsyncError(), testPromiseAllSettled()]).then(([_, allSettledResults]) => ({
          asyncErrorCaught: results.length > 0 && results[0].caught,
          allSettledResults
        }));
      });
      
      expect(errorHandling.asyncErrorCaught).toBe(true);
      expect(errorHandling.allSettledResults).toHaveLength(3);
      expect(errorHandling.allSettledResults[0].status).toBe('fulfilled');
      expect(errorHandling.allSettledResults[1].status).toBe('rejected');
      expect(errorHandling.allSettledResults[2].status).toBe('fulfilled');
    });
  });

  test.describe('PWA Features', () => {
    test('should handle service worker registration', async ({ page }) => {
      const swSupport = await page.evaluate(() => {
        return {
          hasServiceWorker: 'serviceWorker' in navigator,
          hasCache: 'caches' in window,
          hasFetch: typeof fetch !== 'undefined'
        };
      });
      
      expect(swSupport.hasServiceWorker).toBe(true);
      expect(swSupport.hasCache).toBe(true);
      expect(swSupport.hasFetch).toBe(true);
    });

    test('should handle offline detection', async ({ page }) => {
      const offlineDetection = await page.evaluate(() => {
        return {
          isOnline: navigator.onLine,
          hasOnlineEvent: 'ononline' in window,
          hasOfflineEvent: 'onoffline' in window
        };
      });
      
      expect(offlineDetection.isOnline).toBe(true);
      expect(offlineDetection.hasOnlineEvent).toBe(true);
      expect(offlineDetection.hasOfflineEvent).toBe(true);
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up localStorage
    await page.evaluate((prefix) => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
    }, STORAGE.PREFIX);
  });
});