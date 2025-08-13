# MCP Playwright Tools

<!-- nav: docs/tooling/mcp-overview | tags: [mcp, playwright, e2e] | updated: 2025-08-13 -->

## Overview

Playwright MCP provides browser automation for E2E testing, visual regression, and accessibility checks. It uses the accessibility tree instead of pixels, making tests fast and reliable.

## Core Capabilities

- **Fast & Lightweight:** Uses accessibility tree, not screenshots
- **LLM-Friendly:** No vision models needed
- **Deterministic:** Reliable element targeting
- **Real Browser:** Runs in actual browser environment

## Available Tools

### Navigation

- `browser_navigate`: Load URL
- `browser_navigate_back/forward`: Browser history
- `browser_close`: Close page

### Interaction

- `browser_click`: Click elements (single/double, left/right/middle)
- `browser_type`: Type text into fields
- `browser_select_option`: Select dropdown options
- `browser_drag`: Drag and drop between elements
- `browser_hover`: Hover over elements
- `browser_press_key`: Keyboard input (e.g., ArrowLeft, Enter)

### Inspection

- `browser_snapshot`: Get accessibility tree (preferred for testing)
- `browser_take_screenshot`: Visual capture (full page or element)
- `browser_console_messages`: Get console output
- `browser_network_requests`: List network activity

### Advanced

- `browser_evaluate`: Execute JavaScript in page context
- `browser_wait_for`: Wait for text/time conditions
- `browser_file_upload`: Upload files
- `browser_handle_dialog`: Handle alerts/confirms/prompts

### Tab Management

- `browser_tab_new`: Open new tab
- `browser_tab_list`: List all tabs
- `browser_tab_select`: Switch tabs
- `browser_tab_close`: Close tab

## Chess Project Use Cases

### 1. E2E Test - Valid Move Flow

```javascript
// Test a complete move sequence
1. browser_navigate("/train?fen=8/8/4k3/8/8/8/4K3/6R1_w")
2. browser_snapshot()  // Capture initial state
3. browser_click("[data-square='g1']")  // Select rook
4. browser_click("[data-square='g7']")  // Move to g7
5. browser_wait_for({ text: "Schwarz am Zug" })
6. browser_evaluate(() => window.store.getState().game.fen)
   // Verify: "8/6R1/4k3/8/8/8/4K3/8 b - - 1 1"
```

### 2. Visual Regression - Chessboard

```javascript
// Capture board in specific positions
1. browser_navigate("/train?fen=r3k2r/8/8/8/8/8/8/R3K2R_w_KQkq")
2. browser_wait_for({ text: "Weiß am Zug" })
3. browser_take_screenshot({
     element: "#chessboard",
     filename: "castling-position.png"
   })
// Compare with baseline image externally
```

### 3. Invalid Move Rejection

```javascript
// Verify illegal moves are blocked
1. browser_navigate("/train")
2. browser_click("[data-square='e2']")  // Select pawn
3. browser_click("[data-square='e5']")  // Illegal move (too far)
4. browser_snapshot()  // Verify board unchanged
5. browser_console_messages()  // Check for error message
```

### 4. Accessibility Testing

```javascript
// Check WCAG compliance
1. browser_navigate("/")
2. browser_evaluate(() => {
     // Inject and run axe-core
     const script = document.createElement('script');
     script.src = 'https://cdn.jsdelivr.net/npm/axe-core@4/axe.min.js';
     document.head.appendChild(script);

     return new Promise(resolve => {
       script.onload = async () => {
         const results = await axe.run();
         resolve(results.violations);
       };
     });
   })
// Assert no critical violations
```

### 5. Tablebase Integration Test

```javascript
// Test Lichess tablebase responses
1. browser_navigate("/train?fen=8/8/4k3/8/8/8/4K3/6R1_w")
2. browser_click("[data-square='g1']")
3. browser_click("[data-square='g7']")
4. browser_wait_for({ text: "Matt in" })  // Wait for evaluation
5. browser_evaluate(() => {
     const state = window.store.getState();
     return state.tablebase.evaluation;
   })
// Verify correct evaluation received
```

## Best Practices

### Element Selection

```javascript
// Good: Use data attributes
browser_click("[data-testid='submit-button']");
browser_click("[data-square='e4']");

// Avoid: Generic selectors
browser_click(".button"); // Too generic
browser_click("div > span"); // Fragile
```

### Wait Strategies

```javascript
// Wait for specific text
browser_wait_for({ text: "Spielende" });

// Wait for element to disappear
browser_wait_for({ textGone: "Lädt..." });

// Fixed time wait (last resort)
browser_wait_for({ time: 2 });
```

### State Verification

```javascript
// Direct state check via evaluate
const fen = await browser_evaluate(() => window.store.getState().game.fen);

// Visual verification
const snapshot = await browser_snapshot();
// Parse accessibility tree for assertions
```

## Common Patterns

### Setup & Teardown

```javascript
// Before each test
browser_navigate("/");
browser_evaluate(() => {
  // Reset application state
  window.store.getState().reset();
});

// After test
browser_take_screenshot({ filename: "test-end.png" });
browser_close();
```

### Error Handling

```javascript
// Check console for errors
const messages = await browser_console_messages();
const errors = messages.filter((m) => m.type === "error");
assert(errors.length === 0, "No console errors");
```

## Limitations

- **Not for API testing** - Use direct HTTP requests instead
- **No mobile emulation** - Desktop browsers only
- **No network mocking** - Tests against real services
- **Requires browser install** - Use `browser_install` if needed

## Integration with Zen Tools

For comprehensive testing:

1. Use `mcp__zen__testgen` to generate test scenarios
2. Implement with Playwright MCP tools
3. Use `mcp__zen__codereview` to validate test quality
