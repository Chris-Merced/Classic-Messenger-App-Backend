const db = require('../db/queries');

async function logoutUser(req, res) {
    const data = JSON.parse(req.cookies.sessionToken);
    db.deleteSession(data.sessionID)
    res.status(200).json({ message: "Session Deleted" });
}

module.exports = { logoutUser };