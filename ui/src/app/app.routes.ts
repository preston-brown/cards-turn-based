import { Routes } from '@angular/router';
import { CreateRoomComponent } from './components/create-room-component/create-room-component';
import { LandingComponent } from './components/landing-component/landing-component';
import { RoomComponent } from './components/room-component/room-component';

export const routes: Routes = [
  { path: 'landing', component: LandingComponent },
  { path: 'rooms/new', component: CreateRoomComponent },
  { path: 'rooms/:id', component: RoomComponent },
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
];
