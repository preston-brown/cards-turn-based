import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Player, PlayerJoin, Profile, Room } from '../models/models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';

  createRoom(name: string): Observable<Room> {
    return this.http.post<Room>(`${this.apiUrl}/rooms`, { name }, { withCredentials: true });
  }

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}/profile`, { withCredentials: true });
  }

  getRoom(id: string): Observable<Room> {
    return this.http.get<Room>(`${this.apiUrl}/rooms/${id}`, { withCredentials: true });
  }

  joinRoom(id: string): Observable<Player> {
    return this.http.post<Player>(`${this.apiUrl}/rooms/${id}/join`, {}, { withCredentials: true });
  }

  leaveRoom(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/rooms/${id}/leave`, {}, { withCredentials: true });
  }

  logIn(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/login`, {}, { withCredentials: true });
  }

  logOut(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true });
  }
}
