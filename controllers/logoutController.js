const db = require("../db/queries");

async function logoutUser(req, res) {
  try {
    const data = JSON.parse(req.cookies.sessionToken);
    await db.deleteSession(data.sessionID);
    res.status(205).end();
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
}

module.exports = { logoutUser };
