const request = require("supertest");
const server = require("../../index");
const db = require("../../db/queries");

jest.mock("../../db/queries", () => {
  const originalModule = jest.requireActual("../../db/queries");
  return {
    ...originalModule,
    getChatMessagesByName: jest.fn(originalModule.getChatMessagesByName),
    getUserByUserID: jest.fn(originalModule.getUserByUserID),
  };
});

describe("GET /messages/byChatName", () => {
  afterEach(() => {
    cleanupTask.stop();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("should return 200 and the transformed messages on success", async () => {
    const mockMessages = [
      { sender_id: 1, created_at: "2024-12-10T10:00:00Z", content: "Hello!" },
      { sender_id: 2, created_at: "2024-12-10T10:05:00Z", content: "Hi!" },
    ];
    const mockUser1 = { username: "User1" };
    const mockUser2 = { username: "User2" };

    db.getChatMessagesByName.mockResolvedValue(mockMessages);
    db.getUserByUserID.mockImplementation((id) => {
      return id === 1 ? Promise.resolve(mockUser1) : Promise.resolve(mockUser2);
    });

    const response = await request(server).get("/messages/byChatName?chatName=testChat");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      messages: [
        { time: "2024-12-10T10:00:00Z", message: "Hello!", user: "User1" },
        { time: "2024-12-10T10:05:00Z", message: "Hi!", user: "User2" },
      ],
    });

    expect(db.getChatMessagesByName).toHaveBeenCalledWith("testChat");
    expect(db.getUserByUserID).toHaveBeenCalledTimes(2);
    expect(db.getUserByUserID).toHaveBeenCalledWith(1);
    expect(db.getUserByUserID).toHaveBeenCalledWith(2);
  });

  it("should return 401 and an error message on database error", async () => {
    db.getChatMessagesByName.mockRejectedValue(new Error("Database error"));

    const response = await request(server).get("/messages/byChatName?chatName=testChat");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Error getting chat messages by name: Database error" });

    expect(db.getChatMessagesByName).toHaveBeenCalledWith("testChat");
    expect(db.getUserByUserID).not.toHaveBeenCalled();
  });

  it("should return 200 and an empty array if no messages are found", async () => {
    db.getChatMessagesByName.mockResolvedValue([]);

    const response = await request(server).get("/messages/byChatName?chatName=testChat");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ messages: [] });

    expect(db.getChatMessagesByName).toHaveBeenCalledWith("testChat");
    expect(db.getUserByUserID).not.toHaveBeenCalled();
  });
});
