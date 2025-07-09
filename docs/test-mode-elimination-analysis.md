# Test Mode Elimination Analysis

## Current Architecture Overview

### 1. Engine Implementation
The application uses **WebAssembly/WebWorker** architecture for the Stockfish chess engine:

- **Production Engine**: `Engine` class (`/shared/lib/chess/engine/index.ts`)
  - Singleton pattern using `Engine.getInstance()`
  - Direct WebWorker communication with Stockfish WASM
  - No API routes - runs entirely in the browser
  
- **Mock Engine**: `MockEngineService` (`/shared/services/engine/MockEngineService.ts`)
  - Implements `IEngineService` interface
  - Provides deterministic responses for testing
  - Injected via React Context

### 2. Current Test Mode Injection

The test mode injection happens at multiple levels:

1. **EngineContext** (`/shared/contexts/EngineContext.tsx`):
   ```typescript
   const shouldUseTestEngine = testMode ?? (
     process.env.NODE_ENV === 'test' || 
     process.env.NEXT_PUBLIC_E2E_MODE === 'true'
   );
   ```
   - Currently always uses MockEngineService (line 77: TODO comment)
   - No production EngineService implementing IEngineService exists

2. **TrainingBoardZustand** uses `ScenarioEngine` which directly calls `Engine.getInstance()`
   - No dependency injection at this level
   - Test hooks exposed in test mode

3. **BrowserTestApi** checks for test mode before initializing

### 3. Architecture Gaps

1. **Missing Production IEngineService Implementation**: 
   - The EngineContext expects an IEngineService but only MockEngineService implements it
   - The actual Engine class doesn't implement IEngineService interface
   - ScenarioEngine directly uses Engine.getInstance() bypassing the DI system

2. **Mixed Patterns**:
   - Some code uses dependency injection (EngineContext)
   - Other code uses direct singleton access (ScenarioEngine)

## Recommendation: Hybrid Approach

Given the current architecture, I recommend a **hybrid approach** that combines the best of both methods:

### Phase 1: Complete the DI Architecture (Clean, Long-term Solution)

1. **Create ProductionEngineService** that implements IEngineService:
   ```typescript
   export class ProductionEngineService implements IEngineService {
     private engine: Engine;
     
     async initialize(): Promise<void> {
       this.engine = Engine.getInstance();
     }
     
     async analyzePosition(fen: string, config?: EngineConfig): Promise<EngineAnalysis> {
       const evaluation = await this.engine.evaluatePosition(fen);
       const bestMove = await this.engine.getBestMove(fen, config?.timeLimit);
       
       return {
         evaluation: evaluation.score,
         bestMove: bestMove?.san,
         depth: 15,
         timeMs: config?.timeLimit || 1000,
         mateIn: evaluation.mate
       };
     }
     // ... other methods
   }
   ```

2. **Update ScenarioEngine** to use injected engine service:
   - Accept IEngineService in constructor
   - Remove direct Engine.getInstance() calls

3. **Environment-based injection without build-time flags**:
   ```typescript
   // In EngineContext
   const initializeEngine = async () => {
     // Check runtime environment
     const isTestEnvironment = 
       window.location.hostname === 'localhost' && 
       window.location.search.includes('test=true');
     
     const service = isTestEnvironment 
       ? new MockEngineService()
       : new ProductionEngineService();
   };
   ```

### Phase 2: Playwright Route Interception (Quick Win)

For immediate test stability while Phase 1 is implemented:

1. **Create mock service worker pattern**:
   ```typescript
   // tests/e2e/mocks/engine-mock.ts
   export const setupEngineMocks = (page: Page) => {
     // Intercept worker messages
     await page.addInitScript(() => {
       window.Worker = class MockWorker {
         postMessage(data: any) {
           // Mock engine responses
           if (data.includes('go movetime')) {
             this.onmessage?.({ 
               data: 'bestmove e2e4' 
             });
           }
         }
       };
     });
   };
   ```

2. **Use in tests**:
   ```typescript
   test.beforeEach(async ({ page }) => {
     await setupEngineMocks(page);
     await page.goto('/train/1');
   });
   ```

## Benefits of Hybrid Approach

1. **Immediate**: Playwright mocks work without any app changes
2. **Clean Architecture**: DI pattern improves testability and maintainability
3. **No Build Flags**: Runtime detection instead of compile-time flags
4. **Gradual Migration**: Can implement in phases without breaking existing code

## Implementation Priority

1. **Quick Win** (1-2 days): Implement Playwright worker mocking
2. **Architecture** (3-5 days): Complete DI pattern with ProductionEngineService
3. **Cleanup** (1 day): Remove test mode flag references

This approach provides both immediate test stability and long-term architectural improvements.