import Fastify, { FastifyReply } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";

const app = Fastify({
  logger: true,
});

await app.register(cookie);
await app.register(websocket);

await app.register(cors, {
  origin: "http://localhost:4200",
  credentials: true,
});

const roomSockets = new Map<string, Set<WebSocket>>();

function getPlayersByRoom(roomId: string): PublicPlayer[] {
  return players
    .filter((p) => p.room === roomId)
    .map((p) => ({ id: p.id, name: p.name }));
}

function broadcastPlayers(roomId: string) {
  const message = JSON.stringify({
    type: "players",
    players: getPlayersByRoom(roomId),
  });
  for (const socket of roomSockets.get(roomId) ?? []) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }
}

const lastPlayerIdByRoom = new Map<string, number>();

function assignPlayerId(roomId: string): number {
  const result = (lastPlayerIdByRoom.get(roomId) ?? 0) + 1;
  lastPlayerIdByRoom.set(roomId, result);
  return result;
}

interface Player {
  id: number;
  name: string;
  token: string;
  room: string | null;
}

type PublicPlayer = Pick<Player, "id" | "name">;

const players: Player[] = [];

interface Room {
  id: string;
  name: string;
}

const rooms: Room[] = [];

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

const ROOM_ID_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function generateRoomId() {
  const bytes = Buffer.from(crypto.randomUUID().replace(/-/g, ""), "hex");
  let value = BigInt("0x" + bytes.toString("hex"));
  let result = "";
  while (value > 0n) {
    result = ROOM_ID_ALPHABET[Number(value % 62n)] + result;
    value /= 62n;
  }

  return result.padStart(22, "0");
}

rooms.push({ id: "1", name: "One" });
rooms.push({ id: "2", name: "Two" });

app.post<{ Body: CreateRoomRequest }>(
  "/api/rooms",
  { schema: createRoomRequestSchema },
  async (request, reply) => {
    const room: Room = {
      id: generateRoomId(),
      name: request.body.name,
    };
    rooms.push(room);
    return reply.code(201).send(room);
  },
);

app.get("/api/rooms", async (request, reply) => {
  return [...rooms];
});

app.get<{ Params: { id: string } }>(
  "/api/rooms/:id",
  async (request, reply) => {
    const room = rooms.find((room) => room.id === request.params.id);

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
    const room = rooms.find((room) => room.id === roomId);

    if (!room) {
      return reply.code(404).send();
    }

    let playerToken = request.cookies.playerToken;

    if (playerToken) {
      const player = players.find((p) => p.token === playerToken);
      if (player) {
        if (player.room && player.room !== roomId) {
          const oldRoomId = player.room;
          player.room = null;
          broadcastPlayers(oldRoomId);
          player.room = roomId;
        }
        return {
          id: player.id,
          name: player.name,
        };
      }
    }
    return createNewPlayer(roomId, reply);
  },
);

function addSocketToRoom(socket: WebSocket, roomId: string) {
  let sockets = roomSockets.get(roomId);
  if (!sockets) {
    sockets = new Set();
    roomSockets.set(roomId, sockets);
  }
  sockets.add(socket);
}

function removeSocketFromRoom(socket: WebSocket, roomId: string) {
  const sockets = roomSockets.get(roomId);
  sockets?.delete(socket);
  if (sockets?.size === 0) {
    roomSockets.delete(roomId);
  }
}

app.get<{ Params: { id: string } }>(
  "/ws/rooms/:id",
  { websocket: true },
  (socket, request) => {
    const player = players.find((p) => p.token === request.cookies.playerToken);
    if (!player || player.room !== request.params.id) {
      socket.close(1008, "Not a member of this room");
      return;
    }
    addSocketToRoom(socket, request.params.id);

    broadcastPlayers(request.params.id)

    socket.on("close", () => {
      removeSocketFromRoom(socket, request.params.id);
    });
  },
);

function createNewPlayer(roomId: string, reply: FastifyReply) {
  const playerId = assignPlayerId(roomId);
  const playerName = `Player ${playerId}`;
  const playerToken = crypto.randomUUID();
  reply.setCookie("playerToken", playerToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  players.push({
    id: playerId,
    name: playerName,
    token: playerToken,
    room: roomId,
  });

  broadcastPlayers(roomId);

  return {
    id: playerId,
    name: `Player ${playerId}`,
  };
}

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
