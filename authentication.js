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

async function checkAdminStatus(req, res, token, id) {
  try {
    const adminStatus = await db.checkAdminStatus(token, id);
    console.log(adminStatus);
    if (adminStatus) {
      console.log("admin true");
      return true;
    } else {
      console.log("admin false");
      res.status(403).json({ error: "Forbidden" });
    }
  } catch (err) {
    console.log("Error verifying admin status" + err.message);
    return false;
  }
}

module.exports = { compareSessionToken, checkAdminStatus };
