import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Player, PlayerJoin, Room } from '../models/models';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class BackendService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:3000/api';

    createRoom(name: string): Observable<Room> {
        return this.http.post<Room>(`${this.apiUrl}/rooms`, { name })
    }

    getRoom(id: string): Observable<Room> {
        return this.http.get<Room>(`${this.apiUrl}/rooms/${id}`)
    }

    joinRoom(id: string): Observable<Player> {
        return this.http.post<Player>(`${this.apiUrl}/rooms/${id}/join`, {}, { withCredentials: true })
    }
}
