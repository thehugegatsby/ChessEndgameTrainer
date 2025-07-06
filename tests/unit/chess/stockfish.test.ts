import StockfishEngine from '@/lib/stockfish';

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
      // Queue commands while not ready
      engine.sendCommand('position startpos');
      engine.sendCommand('go depth 10');

      // Simulate engine ready
      mockWorker.simulateMessage('uciok');

      // Now all commands should be sent
      expect(mockWorker.postMessage).toHaveBeenCalledWith('position startpos');
      expect(mockWorker.postMessage).toHaveBeenCalledWith('go depth 10');
    });
  });

  describe('Position Setting', () => {
    it('sollte Position mit FEN setzen', () => {
      mockWorker.simulateMessage('uciok');

      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      engine.setPosition(fen);
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith(`position fen ${fen}`);
    });

    it('sollte Start-Position setzen', () => {
      mockWorker.simulateMessage('uciok');

      engine.setPosition('startpos');
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith('position startpos');
    });
  });

  describe('Analysis', () => {
    it('sollte Analyse mit Tiefe starten', () => {
      mockWorker.simulateMessage('uciok');

      engine.analyze(15);
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith('go depth 15');
    });

    it('sollte Default-Tiefe verwenden', () => {
      mockWorker.simulateMessage('uciok');

      engine.analyze();
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith('go depth 20');
    });

    it('sollte Analyse stoppen', () => {
      mockWorker.simulateMessage('uciok');

      engine.stop();
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith('stop');
    });
  });

  describe('Engine Management', () => {
    it('sollte Worker beenden', () => {
      engine.quit();
      
      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('sollte mehrfache quit() Aufrufe behandeln', () => {
      engine.quit();
      engine.quit();
      
      expect(mockWorker.terminate).toHaveBeenCalledTimes(1);
    });

    it('sollte nach quit() keine Befehle mehr senden', () => {
      engine.quit();
      
      engine.sendCommand('position startpos');
      
      // Should not attempt to send after termination
      expect(mockWorker.postMessage.mock.calls.filter(call => 
        call[0] === 'position startpos'
      )).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('sollte Worker-Fehler behandeln', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Simulate worker error
      if (mockWorker.onerror) {
        mockWorker.onerror(new ErrorEvent('error', { message: 'Test error' }));
      }
      
      consoleSpy.mockRestore();
    });

    it('sollte mit null Worker umgehen', () => {
      // Force worker to be null
      (engine as any).worker = null;
      
      expect(() => {
        engine.sendCommand('test');
      }).not.toThrow();
    });
  });

  describe('Ready State', () => {
    it('sollte initial nicht bereit sein', () => {
      expect((engine as any).isReady).toBe(false);
    });

    it('sollte nach uciok bereit sein', () => {
      mockWorker.simulateMessage('uciok');
      
      expect((engine as any).isReady).toBe(true);
    });

    it('sollte readyok verarbeiten', () => {
      const handler = jest.fn();
      engine.setMessageHandler(handler);

      mockWorker.simulateMessage('readyok');
      
      expect(handler).toHaveBeenCalledWith('readyok');
    });
  });

  describe('Multi-PV Support', () => {
    it('sollte Multi-PV Option setzen', () => {
      mockWorker.simulateMessage('uciok');

      engine.setOption('MultiPV', '3');
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith('setoption name MultiPV value 3');
    });
  });

  describe('Engine Options', () => {
    it('sollte Engine-Optionen setzen können', () => {
      mockWorker.simulateMessage('uciok');

      engine.setOption('Hash', '128');
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith('setoption name Hash value 128');
    });

    it('sollte Boolean-Optionen setzen', () => {
      mockWorker.simulateMessage('uciok');

      engine.setOption('Ponder', 'true');
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith('setoption name Ponder value true');
    });
  });
});