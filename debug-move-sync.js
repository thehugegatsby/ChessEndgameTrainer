/**
 * Debug script to test move synchronization issue
 * Run in browser console during E2E test to diagnose the problem
 */

console.log('=== Move Sync Debug Script ===');

// Check if Test Bridge is available
if (typeof window.e2e_makeMove === 'function') {
    console.log('✅ e2e_makeMove is available');
    
    // Get initial state
    const initialState = window.e2e_getGameState();
    console.log('Initial state:', initialState);
    
    // Try to make a move and log everything
    window.e2e_makeMove('e2-e4').then(result => {
        console.log('Move result:', result);
        
        // Get new state
        const newState = window.e2e_getGameState();
        console.log('New state:', newState);
        
        // Check DOM elements
        const movePanel = document.querySelector('[data-testid="move-list"], [data-testid="move-panel"]');
        if (movePanel) {
            console.log('Move panel found:', {
                dataMoveCount: movePanel.getAttribute('data-move-count'),
                innerHTML: movePanel.innerHTML.length > 0 ? 'Has content' : 'Empty'
            });
        } else {
            console.log('❌ Move panel not found');
        }
        
        // Check for move items
        const moveItems = document.querySelectorAll('[data-testid^="move-item"]');
        console.log('Move items found:', moveItems.length);
        
    }).catch(error => {
        console.error('Move failed:', error);
    });
    
} else {
    console.log('❌ e2e_makeMove not available');
}