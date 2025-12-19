const db = require("../db/queries");
const authentication = require("../authentication");

async function deleteMessage(req, res) {
  try {
    const authenticated = await authentication.compareSessionToken(
      req.cookies.sessionToken,
      req.body.id
    );
    if (authenticated) {
      const success = await db.deleteMessage(req.body.messageID);
      if (success) {
        res.status(200).json("Message Deleted Successfully");
      } else {
        res.status(404).json("Message not found for deletion");
      }
    } else {
      res.status(403).json("Unauthorized Action");
    }
  } catch (err) {
    console.log("Error deleting message from database" + err.message);
    res.status(500).json("Internal Server Error");
  }
}

async function banUser(req, res) {
  let days = req.query.days;
  const username = req.query.username;

  try {
    const user = await db.getUserByUsername(username);
    let banExpiresAt = null;
    if (user) {
      if (days === "perm") {
        banExpiresAt = "perm";
      } else {
        days = parseInt(days);
        banExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
      const result = await db.banUser(banExpiresAt, user.id);
      if (result) {
        res.status(200).json({ message: "Good ban" });
      } else {
        res.status(500).json({ error: "Server error while banning user" });
      }
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.log("Error banning user " + err.message);
    res.status(500).json({ error: "Server error while banning user" });
  }
}

async function unbanUser(req, res) {
  try {
    const username = req.body.username;
    const user = await db.getUserByUsername(username);
    if (user) {
      const response = await db.unbanUser(user.id);
      if (response) {
        res.status(200).json({ message: "User unbanned" });
      } else {
        res.status(500).json({ message: "User could not be unbanned" });
      }
    } else {
      console.log("Could not find user of username");
      res.status(404).json({ error: "User Does Not Exist" });
    }
  } catch (err) {
    console.log("Error while banning user" + err.message);
    res.status(500).json({ error: "Server error while banning user" });
  }
}

async function makeAdmin(req, res) {
  try {
    console.log("made it")
    const username = req.body.username;
    const user = await db.getUserByUsername(username);

    if (user) {
      const response = await db.makeAdmin(user.id);
      if (response){
        res.status(200).json({message: "Successfully Created Admin"})
      }else{
        throw new Error("No User Updated")
      }
    } else {
      res.status(404).json({ error: "Could not find user to update" });
    }
  } catch (err) {
    console.log("Error updating admin status: " + err.message);
    res.status(500).json({ error: "Error updating admin status" });
  }
}

module.exports = { deleteMessage, banUser, unbanUser, makeAdmin };
