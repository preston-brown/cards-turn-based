import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import type { FastifyPluginAsync } from "fastify";
import type { RoomService } from "../services/room-service.js";
import type { SocketService } from "../services/socket-service.js";
import { UserService } from "../services/user-service.js";

interface PluginOptions {
  roomService: RoomService;
  socketService: SocketService;
  userService: UserService;
}

export const webSocketRoutes: FastifyPluginAsync<PluginOptions> = async (
  app,
  { roomService, socketService, userService },
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
      const user = userService.findUserByToken(token);
      if (user === undefined) {
        socket.close(1008, "Invalid token");
        return;
      }
      const roomId = request.params.id;
      if (!roomService.isMember(user.id, roomId)) {
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
