const db = require('../db/queries');


async function getUser(req, res) {
    try {
        const sessionData = JSON.parse(req.cookies.sessionToken)
        if (sessionData.sessionID) {
            //query database for the sessions id and retrieve the user id
            const userID = await db.getSession(sessionData.sessionID);
            //query the database for user information to send back to front end
            const user = await db.getUserByUserID(userID);
            const { password, ...userWithoutPassword } = user;
            res.status(200).json({ user: userWithoutPassword });
        }
        else { return res.status(200).json({ message: "No SessionID Stored" }) };
    } catch (err) {
        res.status(401).end();
    }
}

module.exports = {getUser}