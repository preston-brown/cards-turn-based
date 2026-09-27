export class Bot {
  #stopping = false;

  constructor(public readonly name: string) {}

  async start(roomId: string) {
    console.log(`Starting ${this.name}`);
    try {
      const response = await fetch(
        `http://localhost:3000/api/rooms/${roomId}/join`,
        { method: "POST" },
      );
      if (response.status !== 204) {
        throw Error(`Bot ${this.name} failed to join room`);
      }
      while (!this.#stopping) {
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log(error);
    }
  }

  async stop() {
    this.#stopping = true;
    console.log(`Stopped ${this.name}`);
  }
}
