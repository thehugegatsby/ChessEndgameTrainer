import { StockfishEngine } from '@shared/lib/chess/stockfish';

describe('StockfishEngine', () => {
  let postMessageMock: jest.Mock;
  let workerMock: { postMessage: jest.Mock; onmessage: ((event: MessageEvent) => void) | null; terminate: jest.Mock };

  beforeEach(() => {
    postMessageMock = jest.fn();
    workerMock = {
      postMessage: postMessageMock,
      onmessage: null,
      terminate: jest.fn()
    };
    (global.Worker as jest.Mock).mockImplementation(() => workerMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('initialisiert Worker und sendet uci/isready', () => {
    new StockfishEngine();
    expect(global.Worker).toHaveBeenCalledWith('/stockfish.js');
    expect(postMessageMock).toHaveBeenCalledWith('uci');
    expect(postMessageMock).toHaveBeenCalledWith('isready');
  });

  it('sendet Kommandos an den Worker', () => {
    const engine = new StockfishEngine();
    engine.sendCommand('go depth 10');
    expect(postMessageMock).toHaveBeenCalledWith('go depth 10');
  });

  it('setzt und ruft MessageHandler auf', () => {
    const engine = new StockfishEngine();
    const mockHandler = jest.fn();
    engine.setMessageHandler(mockHandler);
    
    // Simuliere eine Nachricht vom Worker
    const mockEvent = new MessageEvent('message', { data: 'bestmove e2e4' });
    if (workerMock.onmessage) {
      workerMock.onmessage(mockEvent);
    }
    
    expect(mockHandler).toHaveBeenCalledWith('bestmove e2e4');
  });
}); 