export interface Room {
  id: string;
  name: string;
}

export interface PlayerJoin {
  playerId: number;
}

export interface Player {
  id: string;
  name: string;
}

export interface PlayersMessage {
  type: 'players';
  players: Player[];
}

export interface Profile {
  id: string;
  name: string;
}
