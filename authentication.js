const db = require("./db/queries");

async function compareSessionToken(token, userID) {
    try {
        const isValid = await db.checkSession(token, userID);
        if (isValid) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.error("Error authenticating user: " + err.message);
    }
}

module.exports = { compareSessionToken };