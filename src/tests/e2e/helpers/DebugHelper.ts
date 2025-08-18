/**
 * 🎯 SYSTEMATIC PLAYWRIGHT DEBUGGING HELPER
 * 
 * Multi-Model Consensus Implementation:
 * - GPT-5: "Focus on deterministic artifacts first"
 * - O3: "Use Playwright native tools before AI"  
 * - Gemini: "Create systematic debugging playbook"
 */

import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import type { TestInfo } from '@playwright/test';

export class DebugHelper {
  constructor(private page: Page, private testInfo: TestInfo) {}

  /**
   * 🔍 PHASE 1: Capture deterministic artifacts (O3 recommendation)
   */
  async capturePageState(label: string) {
    console.info(`🔍 [DebugHelper] Capturing page state: ${label}`);
    
    // 1. DOM Snapshot
    const html = await this.page.content();
    await this.testInfo.attach(`dom-snapshot-${label}.html`, {
      body: html,
      contentType: 'text/html'
    });

    // 2. Console logs
    const consoleLogs = await this.page.evaluate(() => {
      return window.console.logs || [];
    });
    await this.testInfo.attach(`console-logs-${label}.json`, {
      body: JSON.stringify(consoleLogs, null, 2),
      contentType: 'application/json'
    });

    // 3. Screenshot
    await this.page.screenshot({ 
      path: `test-results/debug-${label}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * 🎯 ERROR DIALOG SPECIFIC DEBUGGING
   * Based on our actual error: "[data-testid='move-error-dialog']" not found
   */
  async debugErrorDialog() {
    console.info('🎯 [DebugHelper] Starting Error Dialog Debug Analysis...');

    // 1. Check if dialog exists with different selectors
    const selectors = [
      '[data-testid="move-error-dialog"]',  // E2E test expectation
      '[role="dialog"]',                    // Semantic HTML
      '[role="alertdialog"]',              // Alternative semantic
      '.error-dialog',                     // Class-based
      'dialog',                            // Native dialog element
      '*:has-text("Fehler erkannt")',      // Text-based (German)
      '*:has-text("Weiterspielen")',       // Button text
      '*:has-text("Zurücknehmen")',        // Button text
    ];

    const foundSelectors: string[] = [];
    
    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector);
        const count = await element.count();
        if (count > 0) {
          foundSelectors.push(`${selector} (${count} elements)`);
          
          // Get element details
          const isVisible = await element.first().isVisible();
          const innerHTML = await element.first().innerHTML().catch(() => 'N/A');
          
          console.info(`✅ Found: ${selector} - Visible: ${isVisible}`);
          console.info(`   HTML: ${innerHTML.substring(0, 200)}...`);
        }
      } catch (error) {
        // Selector failed, continue
      }
    }

    if (foundSelectors.length === 0) {
      console.error('❌ NO ERROR DIALOG ELEMENTS FOUND WITH ANY SELECTOR!');
      
      // Check what's actually in the DOM
      await this.debugDOMStructure();
    } else {
      console.info(`✅ Found error dialog elements: ${foundSelectors.join(', ')}`);
    }

    return foundSelectors;
  }

  /**
   * 🔍 TIMING ANALYSIS (Gemini & GPT-5 recommendation)
   * Race conditions between move execution and dialog appearance
   */
  async debugTimingRaceCondition() {
    console.info('⏱️ [DebugHelper] Analyzing timing race conditions...');

    const dialogAppearances = 0;
    const dialogDisappearances = 0;

    // Monitor DOM mutations for dialog-related changes
    await this.page.evaluate(() => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof Element) {
                if (node.matches('[role="dialog"], .error-dialog, *[data-testid*="dialog"]')) {
                  console.info('🔍 [DOM] Dialog element ADDED:', node.outerHTML.substring(0, 100));
                  window.dialogAppearances = (window.dialogAppearances || 0) + 1;
                }
              }
            });
            
            mutation.removedNodes.forEach((node) => {
              if (node instanceof Element) {
                if (node.matches('[role="dialog"], .error-dialog, *[data-testid*="dialog"]')) {
                  console.info('🔍 [DOM] Dialog element REMOVED:', node.outerHTML.substring(0, 100));
                  window.dialogDisappearances = (window.dialogDisappearances || 0) + 1;
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Store observer reference for cleanup
      window.dialogObserver = observer;
    });

    // Wait a bit to catch any immediate changes
    await this.page.waitForTimeout(2000);

    // Get results
    const timingResults = await this.page.evaluate(() => ({
      appearances: window.dialogAppearances || 0,
      disappearances: window.dialogDisappearances || 0
    }));

    console.info(`⏱️ [Timing] Dialog appearances: ${timingResults.appearances}, disappearances: ${timingResults.disappearances}`);
    
    if (timingResults.appearances > 0 && timingResults.disappearances > 0) {
      console.warn('⚠️ RACE CONDITION DETECTED: Dialog appears and disappears quickly!');
    }

    return timingResults;
  }

  /**
   * 🔍 NETWORK & CONSOLE MONITORING (GPT-5 recommendation)
   */
  async setupNetworkAndConsoleMonitoring() {
    console.info('🌐 [DebugHelper] Setting up network and console monitoring...');

    // Monitor console messages
    this.page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      if (text.includes('Error') || text.includes('dialog') || text.includes('move')) {
        console.info(`📱 [Console ${type.toUpperCase()}] ${text}`);
      }
    });

    // Monitor page errors
    this.page.on('pageerror', (error) => {
      console.error('💥 [Page Error]', error.message);
    });

    // Monitor network failures
    this.page.on('requestfailed', (request) => {
      console.warn('🌐 [Network Failed]', request.url(), request.failure());
    });

    // Monitor network requests related to moves/errors
    this.page.on('response', (response) => {
      const url = response.url();
      if (url.includes('move') || url.includes('error') || url.includes('api')) {
        console.info(`🌐 [Network] ${response.status()} ${url}`);
      }
    });
  }

  /**
   * 🔍 DOM STRUCTURE ANALYSIS
   */
  private async debugDOMStructure() {
    console.info('🏗️ [DebugHelper] Analyzing DOM structure...');

    const bodyHTML = await this.page.locator('body').innerHTML();
    
    // Look for any dialog-like elements
    const dialogLikeElements = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const tag = el.tagName.toLowerCase();
        const className = el.className || '';
        const role = el.getAttribute('role') || '';
        const testId = el.getAttribute('data-testid') || '';
        
        return tag === 'dialog' || 
               className.includes('dialog') || 
               className.includes('modal') ||
               role.includes('dialog') ||
               testId.includes('dialog') ||
               el.textContent?.includes('Fehler') ||
               el.textContent?.includes('Weiterspielen');
      });

      return elements.map(el => ({
        tag: el.tagName,
        className: el.className,
        role: el.getAttribute('role'),
        testId: el.getAttribute('data-testid'),
        text: el.textContent?.substring(0, 100),
        visible: el.offsetParent !== null
      }));
    });

    console.info('🏗️ [DOM] Dialog-like elements found:', dialogLikeElements);
    
    await this.testInfo.attach('dom-analysis.json', {
      body: JSON.stringify({
        dialogElements: dialogLikeElements,
        bodyHTML: bodyHTML.substring(0, 5000) // First 5KB
      }, null, 2),
      contentType: 'application/json'
    });
  }

  /**
   * 🎯 COMPLETE ERROR DIALOG DEBUGGING WORKFLOW
   * Combines all debugging strategies from multi-model consensus
   */
  async runCompleteErrorDialogDebugWorkflow(moveDescription: string) {
    console.info(`🎯 [DebugHelper] Starting COMPLETE debug workflow for move: ${moveDescription}`);

    // Setup monitoring first
    await this.setupNetworkAndConsoleMonitoring();
    
    // Capture before state
    await this.capturePageState('before-move');
    
    // Start timing analysis
    await this.debugTimingRaceCondition();
    
    // Wait a moment after move should trigger dialog
    await this.page.waitForTimeout(3000);
    
    // Analyze error dialog presence
    const foundSelectors = await this.debugErrorDialog();
    
    // Capture after state
    await this.capturePageState('after-move');
    
    // Cleanup timing observer
    await this.page.evaluate(() => {
      if (window.dialogObserver) {
        window.dialogObserver.disconnect();
      }
    });

    const summary = {
      moveDescription,
      foundDialogSelectors: foundSelectors,
      timestamp: new Date().toISOString(),
      recommendedActions: this.generateRecommendations(foundSelectors)
    };

    await this.testInfo.attach('debug-summary.json', {
      body: JSON.stringify(summary, null, 2),
      contentType: 'application/json'
    });

    console.info('🎯 [DebugHelper] Complete workflow finished. Check test artifacts for detailed analysis.');
    
    return summary;
  }

  private generateRecommendations(foundSelectors: string[]): string[] {
    const recommendations: string[] = [];

    if (foundSelectors.length === 0) {
      recommendations.push('❌ NO DIALOG FOUND: Check if error conditions are properly triggered');
      recommendations.push('🔍 Verify move actually creates WDL change that should show error');
      recommendations.push('🎯 Check if test position matches manual browser position');
      recommendations.push('⚠️ Investigate if E2E environment has different error handling');
    } else if (foundSelectors.some(s => s.includes('[data-testid="move-error-dialog"]'))) {
      recommendations.push('✅ DIALOG EXISTS: Check visibility and timing');
      recommendations.push('⏱️ Potential race condition - dialog appears/disappears quickly');
    } else {
      recommendations.push('🔧 MISSING TEST ID: Add data-testid="move-error-dialog" to error dialog component');
      recommendations.push('✅ Dialog exists but E2E tests can\'t find it with expected selector');
    }

    return recommendations;
  }
}

// 🎯 GLOBAL HELPER FUNCTIONS FOR EASY ACCESS
declare global {
  interface Window {
    dialogAppearances?: number;
    dialogDisappearances?: number;
    dialogObserver?: MutationObserver;
  }
}