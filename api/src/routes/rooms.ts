import type { FastifyPluginAsync, FastifyReply } from "fastify";
import type { RoomService } from "../services/room-service.js";
import { UserService } from "../services/user-service.js";

interface PluginOptions {
  roomService: RoomService;
  userService: UserService;
}

interface CreateRoomRequest {
  name: string;
}

const createRoomRequestSchema = {
  body: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        minLength: 1,
        maxLength: 30,
        pattern: "^[A-Za-z0-9_-]$",
      },
    },
  },
} as const;

export const roomRoutes: FastifyPluginAsync<PluginOptions> = async (
  app,
  { roomService, userService },
) => {
  app.post<{ Body: CreateRoomRequest }>(
    "",
    { schema: createRoomRequestSchema },
    async (request, reply) => {
      const room = roomService.createRoom(request.body.name);
      return reply.code(201).send(room);
    },
  );

  app.get("", async (request, reply) => {
    return roomService.getRooms();
  });

  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const room = roomService.findRoom(request.params.id);

    if (!room) {
      return reply.code(404).send();
    }

    return room;
  });

  app.post<{ Params: { id: string } }>("/:id/join", async (request, reply) => {
    const roomId = request.params.id;
    const room = roomService.findRoom(roomId);
    if (!room) {
      return reply.code(404).send();
    }
    const userId = getUser(request.cookies.userToken, reply);
    roomService.addToRoom(userId, roomId);
    return reply.code(204).send();
  });

  app.post<{ Params: { id: string } }>("/:id/leave", async (request, reply) => {
    const roomId = request.params.id;
    const room = roomService.findRoom(roomId);
    if (!room) {
      return reply.code(404).send();
    }
    const userToken = request.cookies.userToken;
    if (!userToken) {
      return reply.code(401).send();
    }
    const user = userService.findUserByToken(userToken);
    if (!user) {
      return reply.code(403).send();
    }
    roomService.removeFromRoom(user.id, roomId);
    return reply.code(204).send();
  });

  function getUser(userToken: string | undefined, reply: FastifyReply): string {
    if (userToken) {
      const user = userService.findUserByToken(userToken);
      if (user) {
        return user.id;
      }
    }
    const user = userService.createUser();
    reply.setCookie("userToken", user.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
    return user.id;
  }
};
