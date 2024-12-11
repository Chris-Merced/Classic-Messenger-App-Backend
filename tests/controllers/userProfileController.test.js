const request = require("supertest");
const server = require("../../index");
const db = require("../../db/queries");

jest.mock("../../db/queries", () => {
  const originalModule = jest.requireActual("../../db/queries");
  return {
    ...originalModule,
    getSessionBySessionID: jest.fn(originalModule.getSessionBySessionID),
    getUserByUserID: jest.fn(originalModule.getUserByUserID),
    getUsersByUsernameSearch: jest.fn(originalModule.getUsersByUsernameSearch),
  };
});

describe("User Profile Routes", () => {
  beforeEach(() => {
    cleanupTask.stop();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  describe("GET /userProfile", () => {
    it("should return 200 and user data if sessionID is valid", async () => {
      const mockSessionData = {
        sessionID: "validSessionID",
      };
      const mockUser = { id: 1, username: "testuser", email: "testuser@example.com" };

      db.getSessionBySessionID.mockResolvedValue(1);
      db.getUserByUserID.mockResolvedValue(mockUser);

      const response = await request(server)
        .get("/userProfile/")
        .set("Cookie", `sessionToken=${JSON.stringify(mockSessionData)}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: { id: 1, username: "testuser", email: "testuser@example.com" },
      });

      expect(db.getSessionBySessionID).toHaveBeenCalledWith("validSessionID");
      expect(db.getUserByUserID).toHaveBeenCalledWith(1);
    });

    it("should return 401 if no sessionID is stored", async () => {
      const mockSessionData = {};

      const response = await request(server)
        .get("/userProfile/")
        .set("Cookie", `sessionToken=${JSON.stringify(mockSessionData)}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "No SessionID Stored",
      });
    });

    it("should return 500 if there's an error retrieving user data", async () => {
      const mockSessionData = {
        sessionID: "validSessionID",
      };

      db.getSessionBySessionID.mockRejectedValue(new Error("Database error"));

      const response = await request(server)
        .get("/userProfile/")
        .set("Cookie", `sessionToken=${JSON.stringify(mockSessionData)}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: "Error getting user from database: Database error",
      });
    });
  });

  describe("GET /publicProfile", () => {
    it("should return 200 and user public profile data", async () => {
      const mockUserData = { id: 1, username: "testuser", email: "testuser@example.com" };

      db.getUserByUserID.mockResolvedValue(mockUserData);

      const response = await request(server).get("/userProfile/publicProfile").query({ ID: 1 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: { id: 1, username: "testuser" },
      });

      expect(db.getUserByUserID).toHaveBeenCalledWith("1");
    });

    it("should return 500 if there's an error retrieving public profile", async () => {
      db.getUserByUserID.mockRejectedValue(new Error("Error retrieving user"));

      const response = await request(server).get("/userProfile/publicProfile").query({ ID: 1 });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: "Error: Error retrieving user",
      });
    });
  });

  describe("GET /usersBySearch", () => {
    it("should return 201 and list of users based on username search", async () => {
      const mockUsers = [
        { id: 1, username: "testuser1" },
        { id: 2, username: "testuser2" },
      ];

      db.getUsersByUsernameSearch.mockResolvedValue(mockUsers);

      const response = await request(server)
        .get("/userProfile/usersBySearch")
        .query({ username: "test" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        users: [
          { id: 1, username: "testuser1" },
          { id: 2, username: "testuser2" },
        ],
      });

      expect(db.getUsersByUsernameSearch).toHaveBeenCalledWith("test");
    });

    it("should return 404 if there's an error during search", async () => {
      db.getUsersByUsernameSearch.mockRejectedValue(new Error("Search error"));

      const response = await request(server)
        .get("/userProfile/usersBySearch")
        .query({ username: "test" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: "There was a problem with the username lookup: Search error",
      });
    });
  });
});
