import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from '../../services/backend-service';
import { firstValueFrom, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Player, Profile, Room } from '../../models/models';
import { RoomSocketService } from '../../services/room-socket-service';

type ComponentState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; room: Room };

const SEATS = ['south', 'west', 'north', 'east'] as const;

@Component({
  imports: [],
  selector: 'app-room-component',
  styleUrl: './room-component.css',
  templateUrl: './room-component.html',
})
export class RoomComponent implements OnDestroy, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly backend = inject(BackendService);
  private readonly roomSocketService = inject(RoomSocketService);

  readonly roomId = this.route.snapshot.paramMap.get('id')!;

  private readonly subscriptions: Subscription[] = [];

  readonly state = signal<ComponentState>({ status: 'loading' });
  readonly players = signal<Player[]>([]);
  readonly profile = signal<Profile | null>(null);

  readonly seatedPlayers = computed(() => {
    const players = this.players();
    const currentPlayerId = this.profile()?.id;
    const currentPlayerIndex = players.findIndex((player) => player.id === currentPlayerId);

    if (currentPlayerIndex === -1) return [];

    return players.map((player, index) => ({
      player,
      seat: SEATS[(index - currentPlayerIndex + SEATS.length) % SEATS.length],
    }));
  });

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
      await firstValueFrom(this.backend.joinRoom(this.roomId));
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
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions.push(subscription);
    try {
      const profile = await firstValueFrom(this.backend.getProfile());
      this.profile.set(profile);
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
