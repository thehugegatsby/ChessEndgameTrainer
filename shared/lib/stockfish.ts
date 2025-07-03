export default class StockfishEngine {
  private worker: Worker | null = null;
  private messageHandler: ((message: string) => void) | null = null;
  private isReady: boolean = false;
  private messageQueue: string[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * Validate worker path to prevent script injection attacks
   */
  private isValidWorkerPath(path: string): boolean {
    // Allow only specific whitelisted worker paths
    const allowedPaths = ['/stockfish.js', '/worker/stockfish.js'];
    return allowedPaths.includes(path) && !path.includes('../') && !path.includes('..\\');
  }

  private initialize() {
    if (typeof window !== 'undefined') {
      // Validate worker path to prevent injection attacks
      const workerPath = '/stockfish.js';
      if (!this.isValidWorkerPath(workerPath)) {
        throw new Error('Invalid worker path');
      }
      
      this.worker = new Worker(workerPath);
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
    try {
      // Clear message queue and reset state
      this.messageQueue = [];
      this.messageHandler = null;
      this.isReady = false;
      
      // Properly terminate worker
      if (this.worker) {
        this.worker.postMessage('quit');
        
        // Set timeout for graceful termination
        setTimeout(() => {
          if (this.worker) {
            console.log('[StockfishEngine] 🔄 Force terminating worker');
            this.worker.terminate();
            this.worker = null;
          }
        }, 1000);
        
        this.worker.terminate();
        this.worker = null;
      }
      
      console.log('[StockfishEngine] ✅ Worker cleanup completed');
    } catch (error) {
      console.error('[StockfishEngine] 💥 Error during worker cleanup:', error);
      // Force cleanup even if error occurs
      this.worker = null;
      this.isReady = false;
      this.messageQueue = [];
      this.messageHandler = null;
    }
  }
} 