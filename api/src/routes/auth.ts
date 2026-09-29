import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { UserService } from "../services/user-service.js";

interface PluginOptions {
  userService: UserService;
}

export const authRoutes: FastifyPluginAsync<PluginOptions> = async (
  app,
  { userService },
) => {
  app.post("/login", async (request, reply) => {
    const user = userService.createUser();
    reply.setCookie("userToken", user.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
  });
  app.post("/logout", async (request, reply) => {
    const userToken = request.cookies.userToken;
    if (!userToken) {
      return reply.code(401).send();
    }
    const user = userService.findUserByToken(userToken);
    if (user) {
      userService.deleteUser(user.id);
    }
    reply.clearCookie("userToken", { path: "/" });
    return reply.code(204).send();
  });
};
