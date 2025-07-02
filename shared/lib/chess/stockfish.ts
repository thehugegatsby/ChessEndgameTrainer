export class StockfishEngine {
  private worker: Worker;
  private messageHandler: ((message: string) => void) | null = null;

  constructor() {
    this.worker = new Worker('/stockfish.js');
    this.worker.onmessage = (event) => {
      if (this.messageHandler) {
        this.messageHandler(event.data);
      }
    };
    this.sendCommand('uci');
    this.sendCommand('isready');
  }

  sendCommand(command: string): void {
    this.worker.postMessage(command);
  }

  setMessageHandler(handler: (message: string) => void): void {
    this.messageHandler = handler;
  }

  quit(): void {
    this.sendCommand('quit');
    this.worker.terminate();
  }
} 