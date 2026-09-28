import { RoomDto } from "../model/room.js";
import { SocketService } from "./socket-service.js";
import { UserService } from "./user-service.js";

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
    if (index === -1) {
      return;
    }
    this.#users[index] = null;
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

  createRoom(name: string): RoomDto {
    const id = this.generateRoomId();
    const room = new Room(id, name, 4);
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
    const users = room
      .getUsers()
      .map((userId) => this.userService.findUser(userId))
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
