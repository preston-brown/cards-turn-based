import type { FastifyPluginAsync, FastifyReply } from "fastify";
import type { RoomService } from "../services/room-service.js";
import { UserService } from "../services/user-service.js";

interface PluginOptions {
  roomService: RoomService;
  userService: UserService;
}

interface PatchProfileRequest {
  name?: string;
}

const patchProfileRequestSchema = {
  body: {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1,
        maxLength: 30,
        pattern: "^[A-Za-z0-9_-]+$",
      },
    },
  },
} as const;

export const profileRoutes: FastifyPluginAsync<PluginOptions> = async (
  app,
  { roomService, userService },
) => {
  (app.get("", async (request, reply) => {
    const userToken = request.cookies.userToken;
    if (!userToken) {
      return reply.code(401).send();
    }
    const user = userService.findUserByToken(userToken);
    if (!user) {
      return reply.code(403).send();
    }
    return {
      id: user.id,
      name: user.name,
    };
  }),
    app.patch<{ Body: PatchProfileRequest }>(
      "",
      { schema: patchProfileRequestSchema },
      async (request, reply) => {
        const userToken = request.cookies.userToken;
        if (!userToken) {
          return reply.code(401).send();
        }
        const user = userService.findUserByToken(userToken);
        if (!user) {
          return reply.code(403).send();
        }
        const name = request.body.name;
        if (name) {
          userService.setUserName(user.id, name);
          roomService.broadcastNameChange(user.id);
        }
        return reply.code(204).send();
      },
    ));
};
