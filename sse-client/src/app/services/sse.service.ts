import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SseService {
  private worker: SharedWorker | null = null;
  private clientId: string = '';
  private messageObservable: Observable<MessageEvent> | null = null;

  constructor() {
    this.clientId = 'client-' + Math.random().toString(36).substr(2, 9);
    console.log('SSE Service initialized with clientId:', this.clientId);
  }

  connect(): Observable<MessageEvent> {
    if (this.messageObservable) {
      return this.messageObservable;
    }

    return this.messageObservable = new Observable(observer => {
      try {
        this.worker = new SharedWorker(new URL('../workers/sse.worker', import.meta.url));
        console.log('SharedWorker created');

        this.worker.port.onmessage = (event: MessageEvent) => {
          const { type, data } = event.data;
          console.log('Worker message received:', type, data);

          switch (type) {
            case 'connected':
              console.log('SSE Connection established');
              break;
            case 'message':
              observer.next(new MessageEvent('message', { data }));
              break;
            case 'error':
              observer.error(data);
              break;
          }
        };

        this.worker.port.onmessageerror = (error) => {
          console.error('Worker message error:', error);
          observer.error(error);
        };

        this.worker.port.start();
        console.log('Worker port started');

        this.worker.port.postMessage({
          type: 'connect',
          data: { clientId: this.clientId }
        });
        console.log('Connect message sent to worker');

        return () => {
          console.log('Cleaning up SSE connection');
          this.close();
        };
      } catch (error) {
        console.error('Error creating SharedWorker:', error);
        observer.error(error);
        return () => {};
      }
    });
  }

  close() {
    if (this.worker) {
      console.log('Closing SSE connection');
      this.worker.port.postMessage({ type: 'close' });
      this.worker.port.close();
      this.worker = null;
      this.messageObservable = null;
    }
  }

  getClientId(): string {
    return this.clientId;
  }
} 