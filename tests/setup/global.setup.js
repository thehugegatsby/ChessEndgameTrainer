// Global setup before all tests
module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = '1';
  
  // Mock WASM loading for Stockfish
  global.WebAssembly = global.WebAssembly || {
    instantiate: jest.fn(() => Promise.resolve({
      instance: {
        exports: {
          memory: new ArrayBuffer(1024)
        }
      }
    }))
  };
  
  // Performance benchmarking setup
  global.performance = global.performance || {};
  global.performance.mark = global.performance.mark || jest.fn();
  global.performance.measure = global.performance.measure || jest.fn();
  global.performance.getEntriesByType = global.performance.getEntriesByType || jest.fn(() => []);
  
  console.log('🧪 Global test setup complete');
};