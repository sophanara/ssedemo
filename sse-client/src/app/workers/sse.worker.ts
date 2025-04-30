/// <reference lib="webworker" />

class SseWorker {
  private eventSource: EventSource | null = null;
  private clientId: string = '';

  constructor() {
    // SharedWorker uses onconnect, not onmessage
    self.onconnect = this.handleConnect.bind(this);
  }

  private handleConnect(e: MessageEvent): void {
    const port = e.ports[0];
    port.onmessage = this.handleMessage.bind(this, port);
  }

  private handleMessage(port: MessagePort, event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'connect':
        this.clientId = data.clientId;
        this.connectToSSE(port);
        break;
      case 'close':
        this.closeConnection();
        break;
    }
  }

  private connectToSSE(port: MessagePort): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = `http://localhost:8080/api/sse/connect?clientId=${this.clientId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      port.postMessage({ type: 'connected', data: { clientId: this.clientId } });
    };

    this.eventSource.onmessage = (event) => {
      port.postMessage({ type: 'message', data: event.data });
    };

    this.eventSource.onerror = (error) => {
      port.postMessage({ type: 'error', data: error });
      this.closeConnection();
    };
  }

  private closeConnection(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// Initialize the worker
new SseWorker(); 