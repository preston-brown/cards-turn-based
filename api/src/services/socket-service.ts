import { PlayerDto } from "../model/player.js";

export class SocketService {
  private readonly map: Map<String, Set<WebSocket>> = new Map();

  addSocketToPlayer(socket: WebSocket, playerId: string) {
    let sockets = this.map.get(playerId);
    if (!sockets) {
      sockets = new Set();
      this.map.set(playerId, sockets);
    }
    sockets.add(socket);
  }

  addSocketToRoom(socket: WebSocket, roomId: string) {
    let sockets = this.map.get(roomId);
    if (!sockets) {
      sockets = new Set();
      this.map.set(roomId, sockets);
    }
    sockets.add(socket);
  }

  removeSocketFrom(socket: WebSocket, playerId: string) {
    const sockets = this.map.get(playerId);
    sockets?.delete(socket);
    if (sockets?.size === 0) {
      this.map.delete(playerId);
    }
  }

  removeSocketFromRoom(socket: WebSocket, roomId: string) {
    const sockets = this.map.get(roomId);
    sockets?.delete(socket);
    if (sockets?.size === 0) {
      this.map.delete(roomId);
    }
  }

  broadcastPlayersToRoom(roomId: string, players: PlayerDto[]) {
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

  broadcastToPlayer(playerId: string) {
    const message = JSON.stringify({
      type: "welcome",
      message: "hello",
    });
    for (const socket of this.map.get(playerId) ?? []) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }
}
