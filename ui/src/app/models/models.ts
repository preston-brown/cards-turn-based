export interface PlayerJoin {
  playerId: string;
}

export interface Player {
  id: string;
  name: string;
  position: number;
}

export interface PlayersMessage {
  type: 'players';
  players: Player[];
}

export interface WelcomeMessage {
  type: 'welcome';
  message: string;
}

export interface Profile {
  id: string;
  name: string;
}

export interface RoomListItem {
  id: string;
  name: string;
  maxPlayers: number;
}

export interface Room {
  id: string;
  name: string;
  maxPlayers: number;
}
