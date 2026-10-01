import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from '../../services/backend-service';
import { firstValueFrom, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Player, Profile, Room } from '../../models/models';
import { WebSocketService } from '../../services/web-socket-service';

type ComponentState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; room: Room; profile: Profile; playerId: string };

@Component({
  imports: [],
  selector: 'app-war-room-component',
  styleUrl: './war-room-component.css',
  templateUrl: './war-room-component.html',
})
export class WarRoomComponent implements OnDestroy, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly backend = inject(BackendService);
  private readonly roomSocketService = inject(WebSocketService);

  readonly roomId = this.route.snapshot.paramMap.get('id')!;

  private readonly subscriptions: Subscription[] = [];

  readonly state = signal<ComponentState>({ status: 'loading' });
  readonly players = signal<Player[]>([]);
  readonly currentPlayer = computed(() => {
    const view = this.state();
    if (view.status !== 'loaded') return null;
    return this.players().find((player) => player.id === view.playerId) ?? null;
  });
  readonly opponents = computed(() => {
    const view = this.state();
    if (view.status !== 'loaded') return [];
    return this.players().filter((player) => player.id !== view.playerId);
  });

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  async ngOnInit() {
    let room;
    try {
      room = await firstValueFrom(this.backend.getRoom(this.roomId));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.state.set({ status: 'not-found' });
      } else {
        this.state.set({ status: 'error', message: this.extractMessage(error) });
      }
      return;
    }
    let player;
    try {
      player = await firstValueFrom(this.backend.joinRoom(this.roomId));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.state.set({ status: 'not-found' });
      } else {
        this.state.set({ status: 'error', message: this.extractMessage(error) });
      }
      return;
    }
    const subscription = this.roomSocketService.connectToRoom(this.roomId).subscribe({
      next: (players) => {
        this.players.set(players);
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions.push(subscription);
    try {
      const profile = await firstValueFrom(this.backend.getProfile());
      this.state.set({ status: 'loaded', room, profile, playerId: player.playerId });
    } catch (error) {
      this.state.set({ status: 'error', message: this.extractMessage(error) });
    }
  }

  async leaveRoom(roomId: string) {
    await firstValueFrom(this.backend.leaveRoom(roomId));
    await this.router.navigateByUrl('/');
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
