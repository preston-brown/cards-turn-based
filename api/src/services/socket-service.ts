import { PlayerDto } from "../model/player.js";

export class SocketService {
  private readonly map: Map<String, Set<WebSocket>> = new Map();

  addSocketToRoom(socket: WebSocket, roomId: string) {
    let sockets = this.map.get(roomId);
    if (!sockets) {
      sockets = new Set();
      this.map.set(roomId, sockets);
    }
    sockets.add(socket);
  }

  removeSocketFromRoom(socket: WebSocket, roomId: string) {
    const sockets = this.map.get(roomId);
    sockets?.delete(socket);
    if (sockets?.size === 0) {
      this.map.delete(roomId);
    }
  }

  broadcastPlayers(roomId: string, players: PlayerDto[]) {
    const message = JSON.stringify({
      type: "players",
      players: players,
    });
    for (const socket of this.map.get(roomId) ?? []) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }
}
