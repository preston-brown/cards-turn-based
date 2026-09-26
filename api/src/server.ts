import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";

const app = Fastify({
    logger: true,
});

await app.register(cookie);

await app.register(cors, {
    origin: "http://localhost:4200",
    credentials: true,
});


const lastPlayerIdByRoom = new Map<string, number>();

function assignPlayerId(roomId: string): number {
    const result = (lastPlayerIdByRoom.get(roomId) ?? 0) + 1;
    lastPlayerIdByRoom.set(roomId, result);
    return result;
}

interface Room {
    id: string;
    name: string;
}

const rooms: Room[] = []

interface CreateRoomRequest {
    name: string
}

const createRoomRequestSchema = {
    body: {
        type: "object",
        required: ["name"],
        properties: {
            name: { type: "string", minLength: 1 }
        }
    }
} as const;

const ROOM_ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function generateRoomId() {
    const bytes = Buffer.from(crypto.randomUUID().replace(/-/g, ''), 'hex');
    let value = BigInt('0x' + bytes.toString('hex'));
    let result = '';
    while (value > 0n) {
        result = ROOM_ID_ALPHABET[Number(value % 62n)] + result;
        value /= 62n;
    }

    return result.padStart(22, '0')
}

rooms.push({ id: '1', name: 'One' })
rooms.push({ id: '2', name: 'Two' })

app.post<{ Body: CreateRoomRequest }>(
    "/api/rooms",
    { schema: createRoomRequestSchema },
    async (request, reply) => {
        const room: Room = {
            id: generateRoomId(),
            name: request.body.name,
        };
        rooms.push(room)
        return reply.code(201).send(room);
    })

app.get("/api/rooms", async (request, reply) => {
    return [...rooms]
})

app.get<{ Params: { id: string } }>(
    "/api/rooms/:id",
    async (request, reply) => {
        const room = rooms.find((room) => room.id === request.params.id);

        if (!room) {
            return reply.code(404).send()
        }

        return room;
    })

app.post<{ Params: { id: string } }>(
    "/api/rooms/:id/join",
    async (request, reply) => {
        const room = rooms.find((room) => room.id === request.params.id);

        if (!room) {
            return reply.code(404).send()
        }

        let playerToken = request.cookies.playerToken;

        if (playerToken) {

        } else {
            const playerToken = crypto.randomUUID();
            reply.setCookie('playerToken', playerToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
            });

            const playerId = assignPlayerId(room.id)
            return {
                playerId,
                playerName: `Player ${playerId}`
            }

        }
    }
)


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
