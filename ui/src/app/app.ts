import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BackendService } from './services/backend-service';
import { firstValueFrom } from 'rxjs';

@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private backendService: BackendService = inject(BackendService);
  readonly loggedIn = signal(false);

  async ngOnInit(): Promise<void> {
    this.loggedIn.set(await this.isLoggedIn());
  }

  async logIn(): Promise<void> {
    await firstValueFrom(this.backendService.logIn());
    this.loggedIn.set(await this.isLoggedIn());
  }

  async logOut(): Promise<void> {
    await firstValueFrom(this.backendService.logOut());
    this.loggedIn.set(await this.isLoggedIn());
  }

  private async isLoggedIn(): Promise<boolean> {
    try {
      await firstValueFrom(this.backendService.getProfile());
      return true;
    } catch {
      return false;
    }
  }
}
