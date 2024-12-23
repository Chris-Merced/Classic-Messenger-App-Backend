jest.mock("crypto", () => {
  const fillRandomBytes = (buffer) => {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  };

  return {
    randomUUID: () => "test-session-id",
    randomFillSync: fillRandomBytes,
    getRandomValues: (buf) => fillRandomBytes(buf),
    default: {
      randomFillSync: fillRandomBytes,
    },
    createHash: (algorithm) => ({
      update: (data) => ({
        digest: () => "test-hash",
      }),
    }),
  };
});

const request = require("supertest");
const server = require("../../index");
const db = require("../../db/queries");
const argon2 = require("argon2");
const cron = require("node-cron");

jest.mock("../../db/queries", () => {
  const originalModule = jest.requireActual("../../db/queries");
  return {
    ...originalModule,
    getUserByUsername: jest.fn(originalModule.getUserByUsername),
    storeSession: jest.fn().mockImplementation((userId, sessionId) => Promise.resolve()),
  };
});

jest.mock("argon2", () => ({
  verify: jest.fn(),
}));

const mockUser = {
  id: 18,
  username: "testuser",
  password: "hashedPassword",
};

describe("POST /login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    cleanupTask.stop();
    await new Promise((resolve) => server.close(resolve));
  });

  it("should return 201 and set a cookie on successful login", async () => {
    db.getUserByUsername.mockResolvedValue(mockUser);
    argon2.verify.mockResolvedValue(true);

    const response = await request(server).post("/login").send({
      username: "testuser",
      password: "123",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      username: mockUser.username,
      id: mockUser.id,
    });
    expect(response.headers["set-cookie"]).toBeDefined();
    expect(db.getUserByUsername).toHaveBeenCalledWith("testuser");
    expect(argon2.verify).toHaveBeenCalledWith(mockUser.password, "123");
    expect(db.storeSession).toHaveBeenCalledWith(mockUser.id, "test-session-id");
  }, 10000);

  it("should return 401 for incorrect password", async () => {
    db.getUserByUsername.mockResolvedValue(mockUser);
    argon2.verify.mockResolvedValue(false);

    const response = await request(server).post("/login").send({
      username: "testuser",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Incorrect Password",
    });
    expect(db.storeSession).not.toHaveBeenCalled();
  }, 10000);

  it("should return 404 if user does not exist", async () => {
    db.getUserByUsername.mockResolvedValue(null);

    const response = await request(server).post("/login").send({
      username: "nonexistentuser",
      password: "123",
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Sorry there is no user that matches those credentials",
    });
    expect(db.storeSession).not.toHaveBeenCalled();
  }, 10000);

  it("should handle server errors appropriately", async () => {
    db.getUserByUsername.mockRejectedValue(new Error("Database error"));

    const response = await request(server).post("/login").send({
      username: "testuser",
      password: "password123",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Error: Database error",
    });
    expect(db.storeSession).not.toHaveBeenCalled();
  }, 10000);
}, 30000);
