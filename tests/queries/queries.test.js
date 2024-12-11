const db = require("../../db/queries");
const pool = require("../../db/pool");

jest.mock("../../db/pool", () => ({
  query: jest.fn(),
}));

describe("Database Queries", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("addUser", () => {
    it("should insert a user into the users table", async () => {
      const mockUser = { username: "testuser", password: "hashedPassword" };
      pool.query.mockResolvedValue({});

      await db.addUser(mockUser);

      expect(pool.query).toHaveBeenCalledWith(
        "INSERT INTO users (username,password) VALUES ($1, $2)",
        [mockUser.username, mockUser.password]
      );
    });

    it("should throw an error if the query fails", async () => {
      const mockUser = { username: "testuser", password: "hashedPassword" };
      pool.query.mockRejectedValue(new Error("Database error"));

      await expect(db.addUser(mockUser)).rejects.toThrow("Error adding user");
    });
  });

  describe("getUserByUsername", () => {
    it("should retrieve a user by username", async () => {
      const mockUser = { username: "testuser", password: "hashedPassword" };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await db.getUserByUsername("testuser");

      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith("SELECT * FROM users WHERE username = ($1)", [
        "testuser",
      ]);
    });

    it("should return null if no user is found", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await db.getUserByUsername("nonexistentuser");

      expect(result).toBeUndefined();
    });

    it("should throw an error if the query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database error"));

      await expect(db.getUserByUsername("testuser")).rejects.toThrow(
        "Error getting user by username"
      );
    });
  });

  describe("getUsersByUsernameSearch", () => {
    it("should retrieve users matching the search term", async () => {
      const mockUsers = [
        { id: 1, username: "testuser1" },
        { id: 2, username: "testuser2" },
      ];
      pool.query.mockResolvedValue({ rows: mockUsers });

      const result = await db.getUsersByUsernameSearch("test");

      expect(result).toEqual(mockUsers);
      expect(pool.query).toHaveBeenCalledWith("SELECT * FROM USERS WHERE username ILIKE $1", [
        "%test%",
      ]);
    });

    it("should throw an error if the query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database error"));

      await expect(db.getUsersByUsernameSearch("test")).rejects.toThrow(
        "Problem getting users by username Search"
      );
    });
  });

  describe("getUserByUserID", () => {
    it("should retrieve a user by user ID", async () => {
      const mockUser = { id: 1, username: "testuser", password: "hashedPassword" };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await db.getUserByUserID(1);

      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith("SELECT * FROM users WHERE id = $1", [1]);
    });

    it("should return null if no user is found", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await db.getUserByUserID(99);

      expect(result).toBeUndefined();
    });

    it("should throw an error if the query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database error"));

      await expect(db.getUserByUserID(1)).rejects.toThrow("Error getting user by user ID");
    });
  });

  describe("storeSession", () => {
    it("should insert a session into the sessions table", async () => {
      const userID = 1;
      const sessionID = "session123";
      pool.query.mockResolvedValue({});

      await db.storeSession(userID, sessionID);

      expect(pool.query).toHaveBeenCalledWith(
        "INSERT INTO sessions (session_id, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 day')",
        [sessionID, userID]
      );
    });

    it("should throw an error if the query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database error"));

      await expect(db.storeSession(1, "session123")).rejects.toThrow("Error storing session");
    });
  });

  describe("deleteSession", () => {
    it("should delete a session from the sessions table", async () => {
      const sessionID = "session123";
      pool.query.mockResolvedValue({});

      await db.deleteSession(sessionID);

      expect(pool.query).toHaveBeenCalledWith("DELETE FROM sessions WHERE session_id = ($1)", [
        sessionID,
      ]);
    });

    it("should throw an error if the query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database error"));

      await expect(db.deleteSession("session123")).rejects.toThrow(
        "Error deleting session with Session ID"
      );
    });
  });

  describe("cleanupSchedule", () => {
    it("should delete expired sessions", async () => {
      pool.query.mockResolvedValue({});

      await db.cleanupSchedule();

      expect(pool.query).toHaveBeenCalledWith("DELETE FROM sessions WHERE expires_at<NOW();");
    });

    it("should throw an error if the query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database error"));

      await expect(db.cleanupSchedule()).rejects.toThrow("Error in scheduled database cleanup");
    });
  });
});
