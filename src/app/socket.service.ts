import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { SERVER_ORIGIN } from './config/api.config';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {

  private socket: Socket = io(SERVER_ORIGIN, {
    transports: ['websocket'],
    autoConnect: true
  });

  /** Emits whenever a product is created, updated, or deleted on the server. */
  onProductChanged(): Observable<any> {
    return new Observable(subscriber => {
      const handleCreated = (data: any) => subscriber.next(data);
      const handleUpdated = (data: any) => subscriber.next(data);
      const handleDeleted = (data: any) => subscriber.next(data);

      this.socket.on('productCreated', handleCreated);
      this.socket.on('productUpdated', handleUpdated);
      this.socket.on('productDeleted', handleDeleted);

      return () => {
        this.socket.off('productCreated', handleCreated);
        this.socket.off('productUpdated', handleUpdated);
        this.socket.off('productDeleted', handleDeleted);
      };
    });
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
