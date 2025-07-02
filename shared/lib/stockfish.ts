export default class StockfishEngine {
  private worker: Worker | null = null;
  private messageHandler: ((message: string) => void) | null = null;
  private isReady: boolean = false;
  private messageQueue: string[] = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window !== 'undefined') {
      // Direkt stockfish.js als Worker verwenden
      this.worker = new Worker('/stockfish.js');
      this.worker.onmessage = (event: MessageEvent) => {
        const message = event.data;
        if (this.messageHandler) {
          this.messageHandler(message);
        }
        // Prüfe auf UCI-Initialisierung
        if (typeof message === 'string' && message === 'uciok') {
          this.isReady = true;
          this.processQueue();
        }
      };
      // Initialisiere Engine
      this.worker.postMessage('uci');
      this.worker.postMessage('isready');
    }
  }

  private processQueue() {
    while (this.messageQueue.length > 0) {
      const cmd = this.messageQueue.shift();
      if (cmd && this.worker) {
        this.worker.postMessage(cmd);
      }
    }
  }

  sendCommand(command: string) {
    if (!this.worker) return;
    if (!this.isReady && command !== 'uci' && command !== 'isready') {
      this.messageQueue.push(command);
      return;
    }
    this.worker.postMessage(command);
  }

  setMessageHandler(handler: (message: string) => void) {
    this.messageHandler = handler;
  }

  quit() {
    if (this.worker) {
      this.worker.postMessage('quit');
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
    this.messageQueue = [];
  }
} 