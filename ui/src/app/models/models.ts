export interface Room {
    id: string;
    name: string;
}

export interface PlayerJoin {
    playerId: number;
}

export interface Player {
    id: number;
    name: string;
}

export interface PlayersMessage {
    type: 'players';
    players: Player[];
}