import { PlayerDto } from "../model/player.js";
import { RoomDto } from "../model/room.js";

let playerCounter = 0;

class Room {
  #lastPlayerId = 0;

  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  nextPlayerId(): number {
    return ++this.#lastPlayerId;
  }
}

class Player {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly token: string,
  ) {}
}

export class RoomService {
  readonly ROOM_ID_ALPHABET =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  readonly rooms: Room[] = [];
  readonly players: Player[] = [];
  readonly playerToRoomMap: Map<string, string> = new Map();

  constructor() {
    this.rooms.push(new Room("1", "One"));
    this.rooms.push(new Room("2", "Two"));
  }

  addToRoom(playerId: string, roomId: string) {
    const currentRoomId = this.playerToRoomMap.get(playerId);
    this.playerToRoomMap.set(playerId, roomId);
  }

  createPlayer(): PlayerDto {
    const playerId = crypto.randomUUID();
    const playerName = `Player ${++playerCounter}`;
    const playerToken = crypto.randomUUID();
    const player = new Player(playerId, playerName, playerToken);
    this.players.push(player);
    return {
      id: player.id,
      name: player.name,
    };
  }

  createRoom(name: string): RoomDto {
    const id = this.generateRoomId();
    const room = new Room(id, name);
    this.rooms.push(room);
    return {
      id,
      name,
    };
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.find((room) => room.id === id);
  }

  getRooms(): Room[] {
    return [...this.rooms];
  }

  private generateRoomId() {
    const bytes = Buffer.from(crypto.randomUUID().replace(/-/g, ""), "hex");
    let value = BigInt("0x" + bytes.toString("hex"));
    let result = "";
    while (value > 0n) {
      result = this.ROOM_ID_ALPHABET[Number(value % 62n)] + result;
      value /= 62n;
    }
    return result.padStart(22, "0");
  }
}
