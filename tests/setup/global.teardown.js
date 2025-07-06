// Global teardown after all tests
module.exports = async () => {
  // Clean up any global state
  if (global.gc) {
    global.gc();
  }
  
  console.log('🧹 Global test teardown complete');
};