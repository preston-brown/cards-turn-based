import { Bot } from "./bot.js";

const BOT_NAMES = ["ALICE", "BOB", "CAROL", "DAVE", "EDGAR", "FRANCINE"];

async function main(args: string[]) {
  const [count, roomId] = args;
  if (!count) {
    throw new Error("count is required");
  }
  if (!roomId) {
    throw new Error("roomId is required");
  }
  const bots = Array.from(
    { length: Number(count) },
    (_, index) => new Bot(BOT_NAMES[index] ?? `BOT_${index + 1}`),
  );
  console.log(`Created ${count} bots in room ${roomId}`);
  process.once("SIGINT", () => {
    console.log("Stopping bots...");
    void Promise.allSettled(bots.map((bot) => bot.stop()));
  });
  await Promise.all(bots.map((bot) => bot.start(roomId)));
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error);
});
