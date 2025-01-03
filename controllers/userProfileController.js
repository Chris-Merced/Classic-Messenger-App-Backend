const db = require("../db/queries");

async function getUser(req, res) {
  try {
    const sessionData = JSON.parse(req.cookies.sessionToken);
    if (sessionData.sessionID) {
      const userID = await db.getSessionBySessionID(sessionData.sessionID);
      if (!userID) {
        return res.status(401).json({ message: "Invalid session ID" });
      }

      const user = await db.getUserByUserID(userID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword });
    } else {
      return res.status(401).json({ message: "No SessionID Stored" });
    }
  } catch (err) {
    console.error("Error getting user from database: " + err.message);
    res.status(500).json({ message: "Error getting user from database: " + err.message });
  }
}

async function getUserPublicProfile(req, res) {
  try {
    const userData = await db.getUserByUserID(req.query.ID);
    const { password, email, is_admin, ...user } = userData;
    res.status(200).json({ user: user });
  } catch (err) {
    console.error("Error Retrieving Profile: ", err);
    res.status(500).json({ message: "Error: " + err.message });
  }
}

async function getUsersBySearch(req, res) {
  try {
    const users = await db.getUsersByUsernameSearch(req.query.username);
    res.status(201).json({ users: users });
  } catch (err) {
    console.error("Error getting users during search" + err.message);
    res.status(404).json({
      message: "There was a problem with the username lookup: " + err.message,
    });
  }
}

module.exports = { getUser, getUserPublicProfile, getUsersBySearch };
