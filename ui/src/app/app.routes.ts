import { Routes } from '@angular/router';
import { CreateRoomComponent } from './components/create-room-component/create-room-component';
import { LandingComponent } from './components/landing-component/landing-component';
import { PlayerRoomComponent } from './components/player-room-component/player-room-component';
import { RoomsComponent } from './components/rooms-component/rooms-component';
import { WarRoomComponent } from './components/war-room-component/war-room-component';

export const routes: Routes = [
  { path: 'landing', component: LandingComponent },
  { path: 'admin/rooms', component: RoomsComponent },
  { path: 'admin/rooms/new', component: CreateRoomComponent },
  { path: 'rooms/:id', component: WarRoomComponent },
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
];
