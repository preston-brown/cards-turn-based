import { Injectable, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Player, PlayersMessage, WelcomeMessage } from '../models/models';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  connectToRoom(roomId: string): Observable<Player[]> {
    return new Observable((subscriber) => {
      const socket = new WebSocket(`ws://localhost:3000/ws/rooms/${roomId}`);

      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data) as PlayersMessage;
        console.log(message);

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
  connectToPlayer(roomId: string, playerId: string): Observable<string> {
    return new Observable((subscriber) => {
      const socket = new WebSocket(`ws://localhost:3000/ws/rooms/${roomId}/players/${playerId}`);
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data) as WelcomeMessage;
        console.log(message);

        if (message.type === 'welcome') {
          subscriber.next(message.message);
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
