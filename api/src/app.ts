import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";

import { RoomService } from "./services/room-service.js";
import { SocketService } from "./services/socket-service.js";
import { roomRoutes } from "./routes/rooms.js";
import { webSocketRoutes } from "./routes/websockets.js";

export async function buildApp() {
  const socketService = new SocketService();
  const roomService = new RoomService(socketService);

  const app = Fastify({
    logger: true,
  });

  await app.register(cookie);
  await app.register(websocket);

  await app.register(cors, {
    origin: "http://localhost:4200",
    credentials: true,
  });

  await app.register(roomRoutes, {
    prefix: "/api/rooms",
    roomService,
  });

  await app.register(webSocketRoutes, {
    prefix: "/ws/rooms/",
    roomService,
    socketService,
  });

  return app;
}
