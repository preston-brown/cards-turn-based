import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import type { FastifyPluginAsync } from "fastify";
import type { RoomService } from "../services/room-service.js";
import type { SocketService } from "../services/socket-service.js";

interface PluginOptions {
  roomService: RoomService;
  socketService: SocketService;
}

export const webSocketRoutes: FastifyPluginAsync<PluginOptions> = async (
  app,
  { roomService, socketService },
) => {
  app.get<{ Params: { id: string } }>(
    "/:id",
    { websocket: true },
    (socket, request) => {
      const token = request.cookies.userToken;
      if (token === undefined) {
        socket.close(1008, "Missing token");
        return;
      }
      const player = roomService.findUserByToken(token);
      if (player === undefined) {
        socket.close(1008, "Invalid token");
        return;
      }
      const roomId = request.params.id;
      if (!roomService.isMember(player.id, roomId)) {
        socket.close(1008, "Not a member of this room");
        return;
      }
      socketService.addSocketToRoom(socket, roomId);
      roomService.broadcastPlayersByRoomId(roomId);
      socket.on("close", () => {
        socketService.removeSocketFromRoom(socket, roomId);
      });
    },
  );
};
