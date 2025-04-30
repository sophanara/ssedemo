import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SseService } from '../../services/sse.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sse-demo',
  templateUrl: './sse-demo.component.html',
  styleUrls: ['./sse-demo.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SseDemoComponent implements OnInit, OnDestroy {
  messages: string[] = [];
  private subscription: Subscription | null = null;
  clientId: string = '';

  constructor(
    private sseService: SseService,
    private cdr: ChangeDetectorRef
  ) {
    this.clientId = this.sseService.getClientId();
  }

  ngOnInit() {
    this.connect();
  }

  connect() {
    this.subscription = this.sseService.connect().subscribe({
      next: (event: MessageEvent) => {
        console.log(event);
        this.messages.push(event.data);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('SSE Error:', error);
        this.messages.push('Connection error occurred');
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.sseService.close();
  }
} 