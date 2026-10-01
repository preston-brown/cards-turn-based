import { RoomDto } from "../model/room.js";
import { SocketService } from "./socket-service.js";
import { UserService } from "./user-service.js";

export enum GameType {
  WAR = "war",
  CRAZY_EIGHTS = "crazy_eights",
  OLD_MAID = "old_maid",
}

interface Player {
  userId: string;
  playerId: string;
  position: number;
}

class Room {
  #players: (Player | null)[];

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly maxPlayers: number,
    public readonly type: GameType,
  ) {
    this.#players = Array(maxPlayers).fill(null);
  }

  addPlayer(userId: string): string {
    const index = this.#players.findIndex((p) => p === null);
    if (index === -1) {
      throw Error("Room is full");
    }
    const playerId = `player-${crypto.randomUUID()}`;
    this.#players[index] = {
      playerId,
      userId,
      position: index,
    };
    return playerId;
  }

  getPlayerId(userId: string): string | undefined {
    const player = this.#players.find((p) => p?.userId === userId);
    return player?.playerId;
  }

  getPlayers(): Player[] {
    return this.#players.filter((u) => u !== null);
  }

  containsUser(userId: string): boolean {
    return this.#players.some((p) => p && p.userId === userId);
  }

  removeUser(userId: string) {
    const index = this.#players.findIndex((p) => p && p.userId === userId);
    if (index === -1) {
      return;
    }
    this.#players[index] = null;
  }
}

export class RoomService {
  readonly ROOM_ID_ALPHABET =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  private readonly socketService: SocketService;
  private readonly userService: UserService;
  readonly rooms: Room[] = [];

  constructor(socketService: SocketService, userService: UserService) {
    this.socketService = socketService;
    this.userService = userService;
    this.rooms.push(new Room("1", "FightFightFight", 2, GameType.WAR));
    this.rooms.push(new Room("2", "Craziness", 4, GameType.CRAZY_EIGHTS));
    this.rooms.push(new Room("3", "Golden Age", 4, GameType.OLD_MAID));
  }

  addToRoom(userId: string, roomId: string): string {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) {
      throw new Error("Room does not exist");
    }
    const currentPlayerId = room.getPlayerId(userId);
    if (currentPlayerId) {
      return currentPlayerId;
    }
    const currentRoom = this.findCurrentRoom(userId);
    if (currentRoom) {
      currentRoom.removeUser(userId);
      this.broadcastPlayersByRoom(currentRoom);
    }
    const playerId = room.addPlayer(userId);
    this.broadcastPlayersByRoom(room);
    return playerId;
  }

  broadcastPlayersByRoomId(roomId: string) {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return;
    this.broadcastPlayersByRoom(room);
  }

  createRoom(name: string): RoomDto {
    const id = this.generateRoomId();
    const room = new Room(id, name, 2, GameType.WAR);
    this.rooms.push(room);
    return {
      id,
      name,
    };
  }

  findRoom(id: string): Room | undefined {
    return this.rooms.find((room) => room.id === id);
  }

  getRooms(): Room[] {
    return [...this.rooms];
  }

  isMember(userId: string, roomId: string): boolean {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return false;
    return room.containsUser(userId);
  }

  removeFromRoom(userId: string, roomId: string) {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return;
    room.removeUser(userId);
    this.broadcastPlayersByRoom(room);
  }

  broadcastNameChange(userId: string) {
    const room = this.findCurrentRoom(userId);
    if (!room) return;
    this.broadcastPlayersByRoom(room);
  }

  private broadcastPlayersByRoom(room: Room) {
    let players = [];
    for (const player of room.getPlayers()) {
      const user = this.userService.findUser(player.userId);
      if (user) {
        players.push({
          id: player.playerId,
          name: user.name,
          position: player.position,
        });
      }
    }
    this.socketService.broadcastPlayersToRoom(room.id, players);
  }

  private generateRoomId() {
    let value = BigInt("0x" + crypto.randomUUID().replace(/-/g, ""));
    let result = "";
    while (value > 0n) {
      result += this.ROOM_ID_ALPHABET[Number(value % 62n)];
      value /= 62n;
    }
    return result.padEnd(22, "0");
  }

  private findCurrentRoom(userId: string): Room | undefined {
    for (const room of this.rooms) {
      if (room.containsUser(userId)) {
        return room;
      }
    }
    return undefined;
  }
}
