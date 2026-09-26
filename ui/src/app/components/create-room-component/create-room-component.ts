import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BackendService } from '../../services/backend-service';
import { Room } from '../../models/models';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-create-room-component',
  styleUrl: './create-room-component.css',
  templateUrl: './create-room-component.html',
})
export class CreateRoomComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly backendService = inject(BackendService);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60), Validators.pattern(/\S/)]],
  });
  creating = false;
  createdRoom: Room | null = null;
  errorMessage = '';

  async createRoom(): Promise<void> {
    if (this.form.invalid || this.creating) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.controls.name.value.trim();

    this.creating = true;
    this.createdRoom = null;
    this.errorMessage = '';

    try {
      this.createdRoom = await firstValueFrom(this.backendService.createRoom(name));
      this.form.reset();
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Could not create the room.';
    } finally {
      this.creating = false;
    }
  }
}
