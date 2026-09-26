import { Injectable, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Player, PlayersMessage } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoomSocketService {
  connect(roomId: string): Observable<Player[]> {
    return new Observable((subscriber) => {
      const socket = new WebSocket(`ws://localhost:3000/ws/rooms/${roomId}`);

      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data) as PlayersMessage;

        if (message.type === 'players') {
          subscriber.next(message.players);
        }
      });

      socket.addEventListener('error', () => {
        subscriber.error(new Error('WebSocket connection failed'));
      });

      socket.addEventListener('close', () => {
        subscriber.complete();
      });

      return () => socket.close();
    });
  }
}
