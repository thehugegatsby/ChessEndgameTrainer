import StockfishEngine from '../stockfish';

// Mock Worker class
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = jest.fn();
  terminate = jest.fn();

  // Helper to simulate receiving messages
  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }
}

// Mock global Worker
const mockWorkerClass = jest.fn(() => new MockWorker());
(global as any).Worker = mockWorkerClass;

// Mock window object
const mockWindow = {
  Worker: mockWorkerClass
};
(global as any).window = mockWindow;

describe('StockfishEngine - Comprehensive Coverage', () => {
  let engine: StockfishEngine;
  let mockWorker: MockWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new StockfishEngine();
    mockWorker = mockWorkerClass.mock.results[0].value;
  });

  afterEach(() => {
    engine.quit();
  });

  describe('Initialization', () => {
    it('sollte Worker korrekt initialisieren', () => {
      expect(mockWorkerClass).toHaveBeenCalledWith('/stockfish.js');
      expect(mockWorker.postMessage).toHaveBeenCalledWith('uci');
      expect(mockWorker.postMessage).toHaveBeenCalledWith('isready');
    });

    it('sollte onmessage handler setzen', () => {
      expect(mockWorker.onmessage).toBeDefined();
      expect(typeof mockWorker.onmessage).toBe('function');
    });
  });

  describe('Message Handling', () => {
    it('sollte messageHandler korrekt setzen', () => {
      const handler = jest.fn();
      engine.setMessageHandler(handler);

      mockWorker.simulateMessage('test message');
      
      expect(handler).toHaveBeenCalledWith('test message');
    });

    it('sollte ohne messageHandler nicht crashen', () => {
      expect(() => {
        mockWorker.simulateMessage('test message');
      }).not.toThrow();
    });

    it('sollte uciok message verarbeiten', () => {
      const handler = jest.fn();
      engine.setMessageHandler(handler);

      mockWorker.simulateMessage('uciok');
      
      expect(handler).toHaveBeenCalledWith('uciok');
    });
  });

  describe('Command Sending', () => {
    it('sollte Befehle senden wenn Worker bereit', () => {
      // Simulate engine ready
      mockWorker.simulateMessage('uciok');

      engine.sendCommand('position startpos');
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith('position startpos');
    });

    it('sollte Befehle in Queue stellen wenn nicht bereit', () => {
      // Engine not ready yet
      engine.sendCommand('position startpos');
      engine.sendCommand('go depth 10');

      // Commands should not be sent immediately (except uci/isready)
      const callCount = mockWorker.postMessage.mock.calls.length;
      expect(callCount).toBe(2); // Only uci and isready from initialization
    });

    it('sollte Queue verarbeiten nach uciok', () => {
      // Add commands to queue while not ready
      engine.sendCommand('position startpos');
      engine.sendCommand('go depth 10');

      // Simulate engine becomes ready
      mockWorker.simulateMessage('uciok');

      expect(mockWorker.postMessage).toHaveBeenCalledWith('position startpos');
      expect(mockWorker.postMessage).toHaveBeenCalledWith('go depth 10');
    });

    it('sollte uci und isready Befehle sofort senden', () => {
      engine.sendCommand('uci');
      engine.sendCommand('isready');

      expect(mockWorker.postMessage).toHaveBeenCalledWith('uci');
      expect(mockWorker.postMessage).toHaveBeenCalledWith('isready');
    });

    it('sollte nicht senden wenn Worker null ist', () => {
      // Simulate no window environment
      (global as any).window = undefined;
      const noWindowEngine = new StockfishEngine();
      
      expect(() => {
        noWindowEngine.sendCommand('test');
      }).not.toThrow();
    });
  });

  describe('Engine Lifecycle', () => {
    it('sollte quit korrekt durchführen', () => {
      engine.quit();

      expect(mockWorker.postMessage).toHaveBeenCalledWith('quit');
      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('sollte nach quit keine Befehle mehr senden', () => {
      engine.quit();
      
      jest.clearAllMocks();
      engine.sendCommand('test command');

      expect(mockWorker.postMessage).not.toHaveBeenCalled();
    });

    it('sollte Queue nach quit leeren', () => {
      // Add to queue
      engine.sendCommand('test1');
      engine.sendCommand('test2');
      
      engine.quit();
      
      // Simulate becoming ready (should not process old queue)
      const newEngine = new StockfishEngine();
      const newMockWorker = mockWorkerClass.mock.results[1].value;
      
      newMockWorker.simulateMessage('uciok');
      
      // Should only have initialization calls, not old queue
      expect(newMockWorker.postMessage).toHaveBeenCalledWith('uci');
      expect(newMockWorker.postMessage).toHaveBeenCalledWith('isready');
      expect(newMockWorker.postMessage).not.toHaveBeenCalledWith('test1');
    });
  });

  describe('Server-Side Rendering (SSR)', () => {
    it('sollte graceful handhaben wenn window undefined ist', () => {
      const originalWindow = (global as any).window;
      (global as any).window = undefined;

      expect(() => {
        const ssrEngine = new StockfishEngine();
        ssrEngine.sendCommand('test');
        ssrEngine.setMessageHandler(() => {});
        ssrEngine.quit();
      }).not.toThrow();

      // Restore window
      (global as any).window = originalWindow;
    });
  });

  describe('Edge Cases', () => {
    it('sollte leere Commands handhaben', () => {
      mockWorker.simulateMessage('uciok');
      
      expect(() => {
        engine.sendCommand('');
      }).not.toThrow();
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith('');
    });

    it('sollte multiple uciok messages handhaben', () => {
      const handler = jest.fn();
      engine.setMessageHandler(handler);

      mockWorker.simulateMessage('uciok');
      mockWorker.simulateMessage('uciok');
      mockWorker.simulateMessage('uciok');

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('sollte messageHandler überschreiben können', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      engine.setMessageHandler(handler1);
      engine.setMessageHandler(handler2);

      mockWorker.simulateMessage('test');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith('test');
    });
  });
}); 