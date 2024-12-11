const request = require("supertest");
const server = require("../../index");
const db = require("../../db/queries");
const argon2 = require("argon2");

jest.mock("../../db/queries", () => {
  const originalModule = jest.requireActual("../../db/queries");
  return {
    ...originalModule,
    addUser: jest.fn(originalModule.addUser),
  };
});

jest.mock("argon2", () => ({
  hash: jest.fn(),
}));

describe("POST /signup", () => {
  beforeEach(() => {
    cleanupTask.stop();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("should return 201 and create a user on successful signup", async () => {
    const mockUser = {
      username: "testuser",
      password: "plaintextPassword",
      email: "testuser@example.com",
    };

    argon2.hash.mockResolvedValue("hashedPassword");
    db.addUser.mockResolvedValue();

    const response = await request(server).post("/signup").send(mockUser);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "User Created Successfully",
    });

    expect(argon2.hash).toHaveBeenCalledWith("plaintextPassword");
    expect(db.addUser).toHaveBeenCalledWith({
      ...mockUser,
      password: "hashedPassword",
    });
  });

  it("should return 500 if there is a database error", async () => {
    const mockUser = {
      username: "testuser",
      password: "plaintextPassword",
      email: "testuser@example.com",
    };

    argon2.hash.mockResolvedValue("hashedPassword");
    db.addUser.mockRejectedValue(new Error("Database error"));

    const response = await request(server).post("/signup").send(mockUser);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Error: Database error",
    });

    expect(argon2.hash).toHaveBeenCalledWith("plaintextPassword");
    expect(db.addUser).toHaveBeenCalledWith({
      ...mockUser,
      password: "hashedPassword",
    });
  });

  it("should return 500 if password hashing fails", async () => {
    const mockUser = {
      username: "testuser",
      password: "plaintextPassword",
      email: "testuser@example.com",
    };

    argon2.hash.mockRejectedValue(new Error("Hashing error"));

    const response = await request(server).post("/signup").send(mockUser);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Error: Error hashing password: Hashing error",
    });

    expect(argon2.hash).toHaveBeenCalledWith("plaintextPassword");
    expect(db.addUser).not.toHaveBeenCalled();
  });
});
