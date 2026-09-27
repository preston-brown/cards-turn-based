import { RoomDto } from "../model/room.js";
import { SocketService } from "./socket-service.js";

let userCounter = 0;

class Room {
  #users: (string | null)[];

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly size: number,
  ) {
    this.#users = Array(size).fill(null);
  }

  addUser(userId: string) {
    const index = this.#users.findIndex((u) => u === null);
    if (index === -1) {
      throw Error("Room is full");
    }
    this.#users[index] = userId;
  }

  getUsers(): string[] {
    return this.#users.filter((u) => u !== null);
  }

  containsUser(userId: string): boolean {
    return this.#users.includes(userId);
  }

  removeUser(userId: string) {
    const index = this.#users.findIndex((u) => u === userId);
    if (index === undefined) {
      return;
    }
    this.#users[index] = null;
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

  private readonly socketService: SocketService;
  readonly rooms: Room[] = [];
  readonly users: User[] = [];

  constructor(socketService: SocketService) {
    this.socketService = socketService;
    this.rooms.push(new Room("1", "One", 4));
    this.rooms.push(new Room("2", "Two", 2));
  }

  addToRoom(userId: string, roomId: string) {
    const currentRoom = this.findCurrentRoom(userId);
    if (currentRoom) {
      currentRoom.removeUser(userId);
      this.broadcastPlayersByRoom(currentRoom);
    }
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return;
    room.addUser(userId);
    this.broadcastPlayersByRoom(room);
  }

  broadcastPlayersByRoomId(roomId: string) {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return;
    this.broadcastPlayersByRoom(room);
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
    const room = new Room(id, name, 4);
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

  isMember(userId: string, roomId: string): boolean {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return false;
    return room.containsUser(userId);
  }

  private broadcastPlayersByRoom(room: Room) {
    const users = room
      .getUsers()
      .map((userId) => this.users.find((u) => u.id === userId))
      .filter((u) => !!u)
      .map((u) => ({ id: u.id, name: u.name }));
    this.socketService.broadcastPlayers(room.id, users);
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
