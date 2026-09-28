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
    (_, index) => new Bot(BOT_NAMES[index] ?? `BOT_${index + 1}`, roomId),
  );

  let shutdownPromise: Promise<void> | undefined;

  const handleShutdown = () => {
    if (shutdownPromise) return;
    console.log("Stopping bots...");
    shutdownPromise = Promise.allSettled(bots.map((bot) => bot.stop())).then(
      () => undefined,
    );
  };

  process.once("SIGINT", handleShutdown);
  process.once("SIGTERM", handleShutdown);
  console.log(`Created ${count} bots in room ${roomId}`);
  await Promise.all(bots.map((bot) => bot.start()));
  await shutdownPromise;
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error);
});
