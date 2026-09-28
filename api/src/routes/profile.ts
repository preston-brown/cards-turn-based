import type { FastifyPluginAsync, FastifyReply } from "fastify";
import type { RoomService } from "../services/room-service.js";

interface PluginOptions {
  roomService: RoomService;
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
  { roomService },
) => {
  app.patch<{ Body: PatchProfileRequest }>(
    "",
    { schema: patchProfileRequestSchema },
    async (request, reply) => {
      const userToken = request.cookies.userToken;
      if (!userToken) {
        return reply.code(401).send();
      }
      const user = roomService.findUserByToken(userToken);
      if (!user) {
        return reply.code(403).send();
      }
      const name = request.body.name;
      if (name) {
        roomService.setUserName(user.id, name);
      }
      return reply.code(204).send();
    },
  );
};
