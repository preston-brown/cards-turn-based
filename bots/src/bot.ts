export class Bot {
  #stopping = false;
  #userCookie?: string;

  constructor(
    public readonly name: string,
    public readonly roomId: string,
  ) {}

  async start() {
    console.log(`Starting ${this.name}`);
    try {
      const response = await fetch(
        `http://localhost:3000/api/rooms/${this.roomId}/join`,
        { method: "POST" },
      );
      if (response.status !== 204) {
        throw Error(`${this.name} failed to join room`);
      }
      console.log(`${this.name} joined room`);
      const userCookie = response.headers
        .getSetCookie()
        .find((c) => c.startsWith("userToken="));
      if (!userCookie) {
        throw Error(`${this.name} did not receive a userToken cookie`);
      }
      const cookiePair = userCookie.split(";", 1)[0];
      if (cookiePair === undefined) {
        throw new Error(`${this.name} received an invalid cookie`);
      }
      this.#userCookie = cookiePair;
      while (!this.#stopping) {
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log(error);
    }
  }

  async stop() {
    this.#stopping = true;
    if (!this.#userCookie) {
      console.warn(`${this.name} has no cookie!`);
    } else {
      const response = await fetch(
        `http://localhost:3000/api/rooms/${this.roomId}/leave`,
        { method: "POST", headers: { Cookie: this.#userCookie } },
      );
      if (response.status === 204) {
        console.log(`${this.name} left room`);
      } else {
        console.error(response.text);
      }
    }
    console.log(`Stopped ${this.name}`);
  }
}
