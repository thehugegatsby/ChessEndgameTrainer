/**
 * @fileoverview Mock module mapping for BoardComponent
 */

// Re-export the actual BoardComponent for testing
export { BoardComponent } from '../../e2e/components/BoardComponent';

// Mock the BaseComponent dependency
jest.mock('../../e2e/components/BaseComponent', () => {
  return require('../__mocks__/BaseComponent');
});