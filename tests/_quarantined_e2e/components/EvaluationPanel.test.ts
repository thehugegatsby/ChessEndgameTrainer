/**
 * @fileoverview EvaluationPanel Component Object Tests
 * @description Comprehensive test suite for EvaluationPanel component with robust mock DOM and edge cases
 * Phase 2.4 Step 7: Test suite implementation
 */

import { test, expect } from '@playwright/test';
import { EvaluationPanel, EngineEvaluation } from './EvaluationPanel';
import { TIMEOUTS, SELECTORS } from '../config/constants';

// Mock DOM helper functions
class MockDOMHelper {
  static createMockPage() {
    return {
      locator: (selector: string) => ({
        count: async () => 1,
        first: () => ({
          textContent: async () => MockDOMHelper.getMockContent(selector),
          isVisible: async () => true,
          waitFor: async () => {},
          getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
        }),
        all: async () => [
          {
            textContent: async () => MockDOMHelper.getMockContent(selector),
            isVisible: async () => true,
            getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
          }
        ],
        waitFor: async () => {},
        isVisible: async () => true
      }),
      waitForTimeout: async (ms: number) => {
        await new Promise(resolve => setTimeout(resolve, ms));
      }
    };
  }

  static getMockContent(selector: string): string {
    // Mock content based on selector
    if (selector.includes('evaluation')) {
      return '+1.23';
    } else if (selector.includes('best-move')) {
      return 'Nf3';
    } else if (selector.includes('depth')) {
      return '15';
    } else if (selector.includes('thinking')) {
      return 'Thinking...';
    } else if (selector.includes('nps')) {
      return '1500000';
    }
    return '';
  }

  static getMockAttribute(selector: string, attribute: string): string | null {
    if (attribute === 'data-evaluation') return '+123';
    if (attribute === 'data-best-move') return 'Nf3';
    if (attribute === 'data-depth') return '15';
    if (attribute === 'data-thinking') return 'true';
    return null;
  }
}

test.describe('EvaluationPanel Component Object', () => {
  let evaluationPanel: EvaluationPanel;
  let mockPage: any;

  test.beforeEach(async () => {
    mockPage = MockDOMHelper.createMockPage();
    evaluationPanel = new EvaluationPanel(mockPage as any);
  });

  test.describe('Constructor and Configuration', () => {
    test('should initialize with default configuration', async () => {
      expect(evaluationPanel).toBeDefined();
      expect(evaluationPanel.getDefaultSelector()).toBe(SELECTORS.EVALUATION_PANEL.PRIMARY);
    });

    test('should accept custom configuration', async () => {
      const customPanel = new EvaluationPanel(mockPage as any, '[data-custom="panel"]', {
        evaluationTimeout: 8000,
        enableEvaluationValidation: false,
        evaluationPollInterval: 200
      });
      expect(customPanel).toBeDefined();
    });

    test('should use custom root selector', async () => {
      const customSelector = '[data-custom="evaluation-panel"]';
      const customPanel = new EvaluationPanel(mockPage as any, customSelector);
      expect(customPanel).toBeDefined();
    });
  });

  test.describe('Basic Evaluation Methods', () => {
    test('should get evaluation value', async () => {
      const evaluation = await evaluationPanel.getEvaluation();
      expect(evaluation).toBe(123); // +1.23 converted to centipawns
    });

    test('should get best move', async () => {
      const bestMove = await evaluationPanel.getBestMove();
      expect(bestMove).toBe('Nf3');
    });

    test('should get search depth', async () => {
      const depth = await evaluationPanel.getDepth();
      expect(depth).toBe(15);
    });
  });

  test.describe('Async Methods', () => {
    test('should wait for evaluation', async () => {
      const startTime = Date.now();
      await evaluationPanel.waitForEvaluation(1000);
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly with valid data
    });

    test('should check thinking state', async () => {
      const isThinking = await evaluationPanel.isThinking();
      expect(typeof isThinking).toBe('boolean');
    });

    test('should get complete evaluation info', async () => {
      const evaluationInfo = await evaluationPanel.getEvaluationInfo();
      expect(evaluationInfo).toHaveProperty('evaluation');
      expect(evaluationInfo).toHaveProperty('bestMove');
      expect(evaluationInfo).toHaveProperty('depth');
      expect(evaluationInfo.evaluation).toBe(123);
      expect(evaluationInfo.bestMove).toBe('Nf3');
      expect(evaluationInfo.depth).toBe(15);
    });
  });

  test.describe('Evaluation Parsing Edge Cases', () => {
    test('should parse mate evaluations correctly', async () => {
      // Mock mate evaluation
      const matePanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 1,
          first: () => ({
            textContent: async () => selector.includes('evaluation') ? 'Mate in 3' : MockDOMHelper.getMockContent(selector),
            isVisible: async () => true,
            waitFor: async () => {},
            getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
          }),
          all: async () => [
            {
              textContent: async () => selector.includes('evaluation') ? 'Mate in 3' : MockDOMHelper.getMockContent(selector),
              isVisible: async () => true,
              getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
            }
          ],
          waitFor: async () => {},
          isVisible: async () => true
        })
      } as any);

      const evaluation = await matePanel.getEvaluation();
      expect(evaluation).toBe(29996); // 29999 - 3 (mate in 3)
    });

    test('should parse negative mate evaluations', async () => {
      const negMatePanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 1,
          first: () => ({
            textContent: async () => selector.includes('evaluation') ? '-Mate in 5' : MockDOMHelper.getMockContent(selector),
            isVisible: async () => true,
            waitFor: async () => {},
            getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
          }),
          all: async () => [
            {
              textContent: async () => selector.includes('evaluation') ? '-Mate in 5' : MockDOMHelper.getMockContent(selector),
              isVisible: async () => true,
              getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
            }
          ],
          waitFor: async () => {},
          isVisible: async () => true
        })
      } as any);

      const evaluation = await negMatePanel.getEvaluation();
      expect(evaluation).toBe(-29994); // -29999 + 5 (mate in 5 for opponent)
    });

    test('should handle centipawn values', async () => {
      const cpPanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 1,
          first: () => ({
            textContent: async () => selector.includes('evaluation') ? '+250 cp' : MockDOMHelper.getMockContent(selector),
            isVisible: async () => true,
            waitFor: async () => {},
            getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
          }),
          all: async () => [
            {
              textContent: async () => selector.includes('evaluation') ? '+250 cp' : MockDOMHelper.getMockContent(selector),
              isVisible: async () => true,
              getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
            }
          ],
          waitFor: async () => {},
          isVisible: async () => true
        })
      } as any);

      const evaluation = await cpPanel.getEvaluation();
      expect(evaluation).toBe(250);
    });

    test('should convert pawn values to centipawns', async () => {
      const pawnPanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 1,
          first: () => ({
            textContent: async () => selector.includes('evaluation') ? '+2.5' : MockDOMHelper.getMockContent(selector),
            isVisible: async () => true,
            waitFor: async () => {},
            getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
          }),
          all: async () => [
            {
              textContent: async () => selector.includes('evaluation') ? '+2.5' : MockDOMHelper.getMockContent(selector),
              isVisible: async () => true,
              getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
            }
          ],
          waitFor: async () => {},
          isVisible: async () => true
        })
      } as any);

      const evaluation = await pawnPanel.getEvaluation();
      expect(evaluation).toBe(250); // 2.5 * 100
    });
  });

  test.describe('Best Move Parsing Edge Cases', () => {
    test('should handle castling moves', async () => {
      const castlingPanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 1,
          first: () => ({
            textContent: async () => selector.includes('best-move') ? 'O-O' : MockDOMHelper.getMockContent(selector),
            isVisible: async () => true,
            waitFor: async () => {},
            getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
          }),
          all: async () => [
            {
              textContent: async () => selector.includes('best-move') ? 'O-O' : MockDOMHelper.getMockContent(selector),
              isVisible: async () => true,
              getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
            }
          ],
          waitFor: async () => {},
          isVisible: async () => true
        })
      } as any);

      const bestMove = await castlingPanel.getBestMove();
      expect(bestMove).toBe('O-O');
    });

    test('should handle promotion moves', async () => {
      const promotionPanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 1,
          first: () => ({
            textContent: async () => selector.includes('best-move') ? 'a8=Q+' : MockDOMHelper.getMockContent(selector),
            isVisible: async () => true,
            waitFor: async () => {},
            getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
          }),
          all: async () => [
            {
              textContent: async () => selector.includes('best-move') ? 'a8=Q+' : MockDOMHelper.getMockContent(selector),
              isVisible: async () => true,
              getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
            }
          ],
          waitFor: async () => {},
          isVisible: async () => true
        })
      } as any);

      const bestMove = await promotionPanel.getBestMove();
      expect(bestMove).toBe('a8=Q+');
    });

    test('should remove common prefixes', async () => {
      const prefixPanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 1,
          first: () => ({
            textContent: async () => selector.includes('best-move') ? 'Best move: Nf3' : MockDOMHelper.getMockContent(selector),
            isVisible: async () => true,
            waitFor: async () => {},
            getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
          }),
          all: async () => [
            {
              textContent: async () => selector.includes('best-move') ? 'Best move: Nf3' : MockDOMHelper.getMockContent(selector),
              isVisible: async () => true,
              getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
            }
          ],
          waitFor: async () => {},
          isVisible: async () => true
        })
      } as any);

      const bestMove = await prefixPanel.getBestMove();
      expect(bestMove).toBe('Nf3');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle missing evaluation element', async () => {
      const errorPanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 0,
          first: () => ({ textContent: async () => null }),
          all: async () => [],
          waitFor: async () => { throw new Error('Element not found'); },
          isVisible: async () => false
        })
      } as any);

      await expect(errorPanel.getEvaluation()).rejects.toThrow();
    });

    test('should handle empty evaluation text', async () => {
      const emptyPanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 1,
          first: () => ({
            textContent: async () => '',
            isVisible: async () => true,
            waitFor: async () => {},
            getAttribute: async (attr: string) => null
          }),
          all: async () => [
            {
              textContent: async () => '',
              isVisible: async () => true,
              getAttribute: async (attr: string) => null
            }
          ],
          waitFor: async () => {},
          isVisible: async () => true
        })
      } as any);

      await expect(emptyPanel.getEvaluation()).rejects.toThrow('No evaluation text found');
    });

    test('should handle invalid evaluation text', async () => {
      const invalidPanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 1,
          first: () => ({
            textContent: async () => selector.includes('evaluation') ? 'invalid text' : MockDOMHelper.getMockContent(selector),
            isVisible: async () => true,
            waitFor: async () => {},
            getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
          }),
          all: async () => [
            {
              textContent: async () => selector.includes('evaluation') ? 'invalid text' : MockDOMHelper.getMockContent(selector),
              isVisible: async () => true,
              getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
            }
          ],
          waitFor: async () => {},
          isVisible: async () => true
        })
      } as any);

      await expect(invalidPanel.getEvaluation()).rejects.toThrow('Unable to parse evaluation');
    });
  });

  test.describe('Selector Fallback Strategy', () => {
    test('should fall back to secondary selector', async () => {
      const fallbackPanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => {
          if (selector === SELECTORS.EVALUATION_VALUE.PRIMARY) {
            return {
              count: async () => 0,
              first: () => ({ textContent: async () => null }),
              all: async () => [],
              waitFor: async () => { throw new Error('Primary not found'); },
              isVisible: async () => false
            };
          }
          return {
            count: async () => 1,
            first: () => ({
              textContent: async () => MockDOMHelper.getMockContent(selector),
              isVisible: async () => true,
              waitFor: async () => {},
              getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
            }),
            all: async () => [
              {
                textContent: async () => MockDOMHelper.getMockContent(selector),
                isVisible: async () => true,
                getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
              }
            ],
            waitFor: async () => {},
            isVisible: async () => true
          };
        }
      } as any);

      const evaluation = await fallbackPanel.getEvaluation();
      expect(evaluation).toBe(123);
    });
  });

  test.describe('Performance and Timeout Handling', () => {
    test('should timeout waitForEvaluation appropriately', async () => {
      const timeoutPanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 1,
          first: () => ({
            textContent: async () => {
              if (selector.includes('evaluation')) {
                throw new Error('Evaluation not ready');
              }
              return MockDOMHelper.getMockContent(selector);
            },
            isVisible: async () => true,
            waitFor: async () => {},
            getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
          }),
          all: async () => [
            {
              textContent: async () => {
                if (selector.includes('evaluation')) {
                  throw new Error('Evaluation not ready');
                }
                return MockDOMHelper.getMockContent(selector);
              },
              isVisible: async () => true,
              getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
            }
          ],
          waitFor: async () => {},
          isVisible: async () => true
        })
      } as any);

      await expect(timeoutPanel.waitForEvaluation(100)).rejects.toThrow();
    });

    test('should handle rapid evaluation updates', async () => {
      let callCount = 0;
      const rapidPanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 1,
          first: () => ({
            textContent: async () => {
              if (selector.includes('evaluation')) {
                callCount++;
                return `+${callCount}.0`;
              }
              return MockDOMHelper.getMockContent(selector);
            },
            isVisible: async () => true,
            waitFor: async () => {},
            getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
          }),
          all: async () => [
            {
              textContent: async () => {
                if (selector.includes('evaluation')) {
                  callCount++;
                  return `+${callCount}.0`;
                }
                return MockDOMHelper.getMockContent(selector);
              },
              isVisible: async () => true,
              getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
            }
          ],
          waitFor: async () => {},
          isVisible: async () => true
        })
      } as any);

      const evaluation1 = await rapidPanel.getEvaluation();
      const evaluation2 = await rapidPanel.getEvaluation();
      expect(evaluation2).toBeGreaterThan(evaluation1);
    });
  });

  test.describe('Optional Features', () => {
    test('should handle missing NPS gracefully', async () => {
      const evaluationInfo = await evaluationPanel.getEvaluationInfo();
      expect(evaluationInfo.nps).toBeUndefined();
    });

    test('should parse NPS when available', async () => {
      const npsPanel = new EvaluationPanel({
        ...mockPage,
        locator: (selector: string) => ({
          count: async () => 1,
          first: () => ({
            textContent: async () => MockDOMHelper.getMockContent(selector),
            isVisible: async () => true,
            waitFor: async () => {},
            getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
          }),
          all: async () => [
            {
              textContent: async () => MockDOMHelper.getMockContent(selector),
              isVisible: async () => true,
              getAttribute: async (attr: string) => MockDOMHelper.getMockAttribute(selector, attr)
            }
          ],
          waitFor: async () => {},
          isVisible: async () => true
        })
      } as any);

      const evaluationInfo = await npsPanel.getEvaluationInfo();
      expect(evaluationInfo.nps).toBe(1500000);
    });
  });

  test.describe('Integration Tests', () => {
    test('should handle complete evaluation workflow', async () => {
      // Wait for evaluation
      await evaluationPanel.waitForEvaluation(1000);
      
      // Check if thinking
      const isThinking = await evaluationPanel.isThinking();
      expect(typeof isThinking).toBe('boolean');
      
      // Get complete info
      const evaluationInfo = await evaluationPanel.getEvaluationInfo();
      expect(evaluationInfo.evaluation).toBe(123);
      expect(evaluationInfo.bestMove).toBe('Nf3');
      expect(evaluationInfo.depth).toBe(15);
    });

    test('should maintain consistency across multiple calls', async () => {
      const evaluation1 = await evaluationPanel.getEvaluation();
      const evaluation2 = await evaluationPanel.getEvaluation();
      expect(evaluation1).toBe(evaluation2);

      const bestMove1 = await evaluationPanel.getBestMove();
      const bestMove2 = await evaluationPanel.getBestMove();
      expect(bestMove1).toBe(bestMove2);
    });
  });
});