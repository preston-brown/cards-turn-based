import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';

import { LucidePlus } from '@lucide/angular';

import { BackendService } from '../../services/backend-service';

@Component({
  imports: [AsyncPipe, LucidePlus],
  selector: 'app-rooms-component',
  styleUrl: './rooms-component.css',
  templateUrl: './rooms-component.html',
})
export class RoomsComponent {
  private backendService: BackendService = inject(BackendService);
  private readonly router = inject(Router);

  readonly rooms$ = this.backendService.getRooms();

  createNewRoom() {
    void this.router.navigate(['/admin/rooms/new']);
  }

  deleteRoom(roomId: string) {}
}
