const {
  getUser,
  getUserPublicProfile,
  checkIfFriends,
  changeProfileStatus,
} = require("../../controllers/userProfileController");

jest.mock("../../db/queries", () => ({
  getSessionBySessionID: jest.fn(),
  getUserByUserID: jest.fn(),
  getUsersByUsernameSearch: jest.fn(),
  checkIfFriends: jest.fn(),
  changeProfileStatus: jest.fn(),
  getFriendRequests: jest.fn(),
}));

jest.mock("../../authentication", () => ({
  compareSessionToken: jest.fn(),
}));

const db = require("../../src/db/queriesOld");
const auth = require("../../authentication");

function resDouble() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("userProfileController Unit Testing for Crucial Functions", () => {
  afterEach(jest.clearAllMocks);

  test("getUser → 200 & strips password", async () => {
    db.getSessionBySessionID.mockResolvedValue("111");
    db.getUserByUserID.mockResolvedValue({
      id: "111",
      username: "Alice",
      email: "alice@example.com",
      is_admin: false,
      password: "hashed-pw",
    });

    const req = {
      cookies: {
        sessionToken: JSON.stringify({ sessionID: "ABC" }),
      },
    };
    const res = resDouble();

    await getUser(req, res);

    expect(db.getSessionBySessionID).toHaveBeenCalledWith("ABC");
    expect(db.getUserByUserID).toHaveBeenCalledWith("111");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user: {
        id: "111",
        username: "Alice",
        email: "alice@example.com",
        is_admin: false,
      },
    });
  });

  test("getUserPublicProfile → strips sensitive fields", async () => {
    db.getUserByUserID.mockResolvedValue({
      id: "222",
      username: "Bob",
      email: "bob@example.com",
      is_admin: false,
      password: "pw",
      about_me: "Hi!",
    });

    const req = { query: { ID: "222" } };
    const res = resDouble();

    await getUserPublicProfile(req, res);

    expect(db.getUserByUserID).toHaveBeenCalledWith("222");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user: {
        id: "222",
        username: "Bob",
        about_me: "Hi!",
      },
    });
  });

  test("checkIfFriends → returns friendStatus false", async () => {
    db.checkIfFriends.mockResolvedValue(null);

    const req = { query: { userID: "1", friendID: "2" } };
    const res = resDouble();

    await checkIfFriends(req, res);

    expect(db.checkIfFriends).toHaveBeenCalledWith("1", "2");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ friendStatus: false });
  });

  test("changeProfileStatus - permission denied branch", async () => {
    const req = {
      cookies: { sessionToken: "token" },
      body: { userID: "5", status: true },
    };
    const res = resDouble();

    await changeProfileStatus(req, res);

    expect(auth.compareSessionToken).toHaveBeenCalledWith("token", "5");
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You do not have permission to modify this value",
      changed: false,
    });
    expect(db.changeProfileStatus).not.toHaveBeenCalled();
  });
});
