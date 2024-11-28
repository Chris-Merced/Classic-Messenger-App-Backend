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

async function getUserPublicProfile(req, res) {
    try {
        const userData = await db.getUserByUserID(req.query.ID);
        const {password, email, is_admin, ...user} = userData;
        res.status(200).json({user: user})
    } catch (err) {
        console.error("Error Retrieving Profile: ", err);
        res.status(404).json({ message: "Error Retrieving Profile" });
    }
}

async function getUsersBySearch(req, res) {
    try {
        const users = await db.getUsersByUsernameSearch(req.query.username)
        res.status(201).json({users: users})
        
    } catch (err) {
        res.status(404).json({message: "There was a problem with the username lookup: " + err})
    }
}

module.exports = {getUser, getUserPublicProfile, getUsersBySearch}