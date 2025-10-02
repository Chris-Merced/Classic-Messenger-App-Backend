const { logoutUser } = require("../../controllers/logoutController");

jest.mock("../../db/queries", () => ({
  deleteSession: jest.fn(),
}));

const db = require("../../src/db/queriesOld");

function fakeReq(sessionID = 42) {
  return {
    cookies: {
      sessionToken: JSON.stringify({ sessionID }),
    },
  };
}

function fakeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("logoutUser Controller Unit Testing for Crucial Functions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("successful path deletes session and returns 200", async () => {
    const req = fakeReq(99);
    const res = fakeRes();

    await logoutUser(req, res);

    expect(db.deleteSession).toHaveBeenCalledTimes(1);
    expect(db.deleteSession).toHaveBeenCalledWith(99);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Logout Successful" });
  });

  test("error path DB throws ⇒ logs & responds 500", async () => {
    db.deleteSession.mockRejectedValueOnce(new Error("DB down"));

    const req = fakeReq(123);
    const res = fakeRes();

    await logoutUser(req, res);

    expect(db.deleteSession).toHaveBeenCalledWith(123);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/Error in logging out user/i),
      })
    );
  });
});
