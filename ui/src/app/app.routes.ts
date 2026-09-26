import { Routes } from '@angular/router';
import { CreateRoomComponent } from './components/create-room-component/create-room-component';
import { RoomComponent } from './components/room-component/room-component';

export const routes: Routes = [
    { path: 'rooms/new', component: CreateRoomComponent },
    { path: 'rooms/:id', component: RoomComponent   },
    { path: '', redirectTo: 'rooms/new', pathMatch: 'full' },
];
