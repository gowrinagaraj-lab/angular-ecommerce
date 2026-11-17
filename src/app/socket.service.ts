import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, merge } from 'rxjs';
import { SERVER_ORIGIN } from './config/api.config';

export interface ProductEvent<T = any> {
  message?: string;
  data: T;
  /** true when `data` only carries the changed fields (e.g. { _id, stock }) */
  partial?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {

  private socket: Socket = io(SERVER_ORIGIN, {
    transports: ['websocket'],
    autoConnect: true
  });

  private on<T>(event: string): Observable<ProductEvent<T>> {
    return new Observable(subscriber => {
      const handler = (payload: ProductEvent<T>) => subscriber.next(payload);
      this.socket.on(event, handler);
      return () => this.socket.off(event, handler);
    });
  }

  onProductCreated(): Observable<ProductEvent> {
    return this.on('productCreated');
  }

  onProductUpdated(): Observable<ProductEvent> {
    return this.on('productUpdated');
  }

  onProductDeleted(): Observable<ProductEvent<{ _id: string }>> {
    return this.on('productDeleted');
  }

  /** Emits whenever a product is created, updated, or deleted on the server. */
  onProductChanged(): Observable<ProductEvent> {
    return merge(this.onProductCreated(), this.onProductUpdated(), this.onProductDeleted());
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
