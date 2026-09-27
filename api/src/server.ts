import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";

import { RoomService } from "./services/room-service.js";
import { SocketService } from "./services/socket-service.js";

const app = Fastify({
  logger: true,
});

await app.register(cookie);
await app.register(websocket);

await app.register(cors, {
  origin: "http://localhost:4200",
  credentials: true,
});

const socketService = new SocketService();
const roomService = new RoomService(socketService);

app.get<{ Params: { id: string } }>(
  "/api/players/:id",
  async (request, reply) => {
    if (!request.cookies.playerToken) {
      return reply.code(401).send();
    }
    const player = roomService.findUser(request.params.id);
    if (!player) {
      return reply.code(404).send();
    }
    if (player.token !== request.cookies.playerToken) {
      return reply.code(403).send();
    }
    return player;
  },
);

interface CreateRoomRequest {
  name: string;
}

const createRoomRequestSchema = {
  body: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1 },
    },
  },
} as const;

app.post<{ Body: CreateRoomRequest }>(
  "/api/rooms",
  { schema: createRoomRequestSchema },
  async (request, reply) => {
    const room = roomService.createRoom(request.body.name);
    return reply.code(201).send(room);
  },
);

app.get("/api/rooms", async (request, reply) => {
  return roomService.getRooms();
});

app.get<{ Params: { id: string } }>(
  "/api/rooms/:id",
  async (request, reply) => {
    const room = roomService.findRoom(request.params.id);

    if (!room) {
      return reply.code(404).send();
    }

    return room;
  },
);

app.post<{ Params: { id: string } }>(
  "/api/rooms/:id/join",
  async (request, reply) => {
    const roomId = request.params.id;
    const room = roomService.findRoom(roomId);
    if (!room) {
      return reply.code(404).send();
    }
    const userId = getUser(request.cookies.userToken, reply);
    roomService.addToRoom(userId, roomId);
    return reply.code(204).send();
  },
);

function getUser(userToken: string | undefined, reply: FastifyReply): string {
  if (userToken) {
    const user = roomService.findUserByToken(userToken);
    if (user) {
      return user.id;
    }
  }
  const user = roomService.createUser();
  reply.setCookie("userToken", user.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
  return user.id;
}

app.get<{ Params: { id: string } }>(
  "/ws/rooms/:id",
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

const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({
    host: "0.0.0.0",
    port,
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
