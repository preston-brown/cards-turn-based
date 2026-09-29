class User {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly token: string,
  ) {}
}

export class UserService {
  readonly #users: User[] = [];
  #userCounter = 0;

  createUser(): User {
    const id = crypto.randomUUID();
    const name = `User ${++this.#userCounter}`;
    const token = crypto.randomUUID();
    const user = new User(id, name, token);
    this.#users.push(user);
    return user;
  }

  deleteUser(id: string) {
    const index = this.#users.findIndex((u) => u.id === id);
    if (index == -1) return;
    this.#users.splice(index, 1);
  }

  findUser(id: string): User | undefined {
    return this.#users.find((u) => u.id === id);
  }

  findUserByToken(token: string): User | undefined {
    return this.#users.find((u) => u.token === token);
  }

  setUserName(userId: string, name: string) {
    const user = this.#users.find((u) => u.id === userId);
    if (!user) return;
    user.name = name;
  }
}
