import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from '../../services/backend-service';
import { firstValueFrom, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Player, Room } from '../../models/models';
import { RoomSocketService } from '../../services/room-socket-service';

type ComponentState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; room: Room };

@Component({
  imports: [],
  selector: 'app-room-component',
  styleUrl: './room-component.css',
  templateUrl: './room-component.html',
})
export class RoomComponent implements OnDestroy, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly backend = inject(BackendService);
  private readonly roomSocketService = inject(RoomSocketService);
  private readonly subscriptions: Subscription[] = [];

  readonly roomId = this.route.snapshot.paramMap.get('id')!;
  readonly state = signal<ComponentState>({ status: 'loading' });
  readonly players = signal<Player[]>([]);
  readonly player = signal<Player | null>(null);

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  async ngOnInit() {
    try {
      const room = await firstValueFrom(this.backend.getRoom(this.roomId));
      this.state.set({ status: 'loaded', room });
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.state.set({ status: 'not-found' });
      } else {
        this.state.set({ status: 'error', message: this.extractMessage(error) });
      }
      return;
    }
    try {
      const player = await firstValueFrom(this.backend.joinRoom(this.roomId));
      this.player.set(player);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.state.set({ status: 'not-found' });
      } else {
        this.state.set({ status: 'error', message: this.extractMessage(error) });
      }
      return;
    }
    const subscription = this.roomSocketService.connect(this.roomId).subscribe({
      next: (players) => {
        this.players.set(players);
        console.log(players);
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions.push(subscription);
  }

  private extractMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Could not connect to the server';
    } else if (error instanceof Error) {
      return error.message;
    } else {
      return 'An unexpected error occurred';
    }
  }
}
