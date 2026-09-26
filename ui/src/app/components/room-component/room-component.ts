import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from '../../services/backend-service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Room } from '../../models/models';

type ComponentState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; room: Room }

@Component({
  imports: [],
  selector: 'app-room-component',
  styleUrl: './room-component.css',
  templateUrl: './room-component.html',
})
export class RoomComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly backend = inject(BackendService)
  readonly roomId = this.route.snapshot.paramMap.get('id')!;

  state = signal<ComponentState>({ status: 'loading' })

  async ngOnInit() {
    try {
      const room = await firstValueFrom(this.backend.getRoom(this.roomId))
      this.state.set({ status: 'loaded', room })
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.state.set({ status: 'not-found' })
      } else {
        this.state.set({ status: 'error', message: this.extractMessage(error) })
      }
    }
    try {
      const joinPlayer = await firstValueFrom(this.backend.joinRoom(this.roomId));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.state.set({ status: 'not-found' })
      } else {
        this.state.set({ status: 'error', message: this.extractMessage(error) })
      }
    }
  }

  private extractMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Could not connect to the server'
    } else if (error instanceof Error) {
      return error.message
    } else {
      return 'An unexpected error occurred'
    }
  }
}
