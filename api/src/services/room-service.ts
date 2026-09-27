import { RoomDto } from "../model/room.js";
import { SocketService } from "./socket-service.js";

let userCounter = 0;

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

class User {
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
  readonly users: User[] = [];
  readonly userToRoomMap: Map<string, string> = new Map();
  private readonly socketService: SocketService;

  constructor(socketService: SocketService) {
    this.socketService = socketService;
    this.rooms.push(new Room("1", "One"));
    this.rooms.push(new Room("2", "Two"));
  }

  addToRoom(userId: string, roomId: string) {
    const removedFromRoomId = this.userToRoomMap.get(userId);
    this.userToRoomMap.set(userId, roomId);
    if (removedFromRoomId) {
      this.broadcastRoomPlayers(removedFromRoomId);
    }
    this.broadcastRoomPlayers(roomId);
  }

  broadcastRoomPlayers(roomId: string) {
    const players = this.users
      .filter((p) => this.userToRoomMap.get(p.id) === roomId)
      .map((p) => ({ id: p.id, name: p.name }));
    this.socketService.broadcastPlayers(roomId, players);
  }

  createUser(): User {
    const id = crypto.randomUUID();
    const name = `User ${++userCounter}`;
    const token = crypto.randomUUID();
    const user = new User(id, name, token);
    this.users.push(user);
    return user;
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

  findUser(id: string): User | undefined {
    return this.users.find((p) => p.id === id);
  }

  findUserByToken(token: string): User | undefined {
    return this.users.find((p) => p.token === token);
  }

  findRoom(id: string): Room | undefined {
    return this.rooms.find((room) => room.id === id);
  }

  getRooms(): Room[] {
    return [...this.rooms];
  }

  isMember(userId: string, roomId: string) {
    return this.userToRoomMap.get(userId) === roomId;
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
}
