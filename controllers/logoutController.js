const db = require('../db/queries');

async function logoutUser(req, res) {
    const data = JSON.parse(req.cookies.sessionToken);
    db.deleteSession(data.sessionID)
}

module.exports = { logoutUser };