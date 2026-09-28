import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { RoomService } from "../services/room-service.js";

interface PluginOptions {
  roomService: RoomService;
}

export const loginRoutes: FastifyPluginAsync<PluginOptions> = async (
  app,
  { roomService },
) => {
  app.get("", async (request, reply) => {});
};
