const request = require("supertest");
const server = require("../../index");
const db = require("../../db/queries");

jest.mock("../../db/queries", () => {
  const originalModule = jest.requireActual("../../db/queries");
  return {
    ...originalModule,
    deleteSession: jest.fn(originalModule.deleteSession),
  };
});

describe("DELETE /logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    cleanupTask.stop();
    await new Promise((resolve) => server.close(resolve));
  });

  it("should return 200 and delete session on successful logout", async () => {
    const mockSessionData = {
      sessionID: "session123",
    };
    const mockCookie = {
      sessionToken: JSON.stringify(mockSessionData),
    };

    db.deleteSession.mockResolvedValue();

    const response = await request(server)
      .delete("/logout")
      .set("Cookie", `sessionToken=${mockCookie.sessionToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Logout Successful" });

    expect(db.deleteSession).toHaveBeenCalledWith("session123");
  });

  it("should return 500 if sessionToken cookie is missing or invalid", async () => {
    const response = await request(server).delete("/logout");

    expect(response.status).toBe(500);

    expect(db.deleteSession).not.toHaveBeenCalled();
  });

  it("should handle server errors appropriately", async () => {
    db.deleteSession.mockRejectedValue(new Error("Database error"));

    const mockSessionData = {
      sessionID: "session123",
    };
    const mockCookie = {
      sessionToken: JSON.stringify(mockSessionData),
    };

    const response = await request(server)
      .delete("/logout")
      .set("Cookie", `sessionToken=${mockCookie.sessionToken}`);

    expect(response.status).toBe(500);

    expect(db.deleteSession).toHaveBeenCalledWith("session123");
  });
});
