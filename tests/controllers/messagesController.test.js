const request = require("supertest");
const server = require("../../index");
const db = require("../../db/queries");

jest.mock("../../db/queries");

describe("Messages Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /messages/byChatName", () => {
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
    });

    it("should return 500 and an error message on database error", async () => {
      db.getChatMessagesByName.mockRejectedValue(new Error("Database error"));

      const response = await request(server).get("/messages/byChatName?chatName=testChat");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: "Error getting chat messages: Database error",
      });
    });

    it("should return 200 and an empty array if no messages are found", async () => {
      db.getChatMessagesByName.mockResolvedValue([]);

      const response = await request(server).get("/messages/byChatName?chatName=testChat");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ messages: [] });
    });
  });

  describe("GET /messages/userChats", () => {
    it("should return 200 and user chats on success", async () => {
      const mockUserChats = [
        { conversation_id: 1, name: "Chat1" },
        { conversation_id: 2, name: "Chat2" },
      ];

      db.getUserChats.mockResolvedValue(mockUserChats);

      const response = await request(server).get("/messages/userChats?userID=123");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ userChats: mockUserChats });
    });

    it("should return empty array if no chats are found", async () => {
      db.getUserChats.mockResolvedValue([]);

      const response = await request(server).get("/messages/userChats?userID=123");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ userChats: [] });
    });

    it("should handle missing userID parameter", async () => {
      db.getUserChats.mockResolvedValue([]);

      const response = await request(server).get("/messages/userChats");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ userChats: [] });
    });

    it("should handle database errors", async () => {
      db.getUserChats.mockRejectedValue(
        new Error("Error retrieving user chats: connection refused")
      );

      const response = await request(server).get("/messages/userChats?userID=123");

      expect(response.status).toBe(500);
    });
  });
});
