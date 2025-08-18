// Debug script to test navigation state
// Run in browser console on /train/1

console.log('🔍 Debug Navigation State Script');

// Helper to get current store state
function getStoreState() {
  // Access window store (assuming it's exposed)
  const storeElement = document.querySelector('[data-store-debug]') || window;
  
  // Try to access React devtools or direct store
  if (window.__ZUSTAND_STORE__) {
    return window.__ZUSTAND_STORE__.getState();
  }
  
  // Fallback: try to extract from DOM or other methods
  console.log('Store not directly accessible, trying alternative methods...');
  return null;
}

// Check initial state
console.log('1. Initial navigation state:');
const initialState = getStoreState();
if (initialState) {
  console.log('nextPosition:', initialState.training?.nextPosition);
  console.log('prevPosition:', initialState.training?.previousPosition);
} else {
  console.log('Store not accessible via window.__ZUSTAND_STORE__');
}

// Add manual test instructions
console.log(`
🧪 Manual Test Instructions:
1. Make a move (e6 → d6) via UI
2. Watch console for logs:
   - [STORE] Navigation refresh successful
   - [REACT RENDER] nextPosition ID  
3. Click "Nächste Stellung →" button
4. Watch for [REACT CLICK] log
5. Check if URL changes to /train/2

Expected Timeline:
- Move → Store Update → React Re-render → Button Click → Navigation
`);