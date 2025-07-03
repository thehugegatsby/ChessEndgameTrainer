import '../setup';

describe('Test Setup', () => {
  test('setup file loads without errors', () => {
    // If we get here, the setup file loaded successfully
    expect(true).toBe(true);
  });

  test('global test environment is configured', () => {
    // Check that common global test utilities are available
    expect(global.expect).toBeDefined();
    expect(global.test).toBeDefined();
    expect(global.describe).toBeDefined();
  });

  test('jest is configured', () => {
    expect(jest).toBeDefined();
    expect(jest.fn).toBeDefined();
    expect(jest.mock).toBeDefined();
  });
});