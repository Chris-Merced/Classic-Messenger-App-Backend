const db = require("../db/queriesOld");
const authentication = require("../authentication");

//REROUTE ALL DB IMPORTS AT THE TOP TO NEW QUERIES.TS, ENSURE EVERYTHING IS FUNCTIONAL
// FILES AFFECTED: INDEX.JS, AUTHENTICATION.JS, ALL CONTROLLERS
// TESTS WILL ALSO BE AFFECTED
//AFTER THAT
//START HERE FOR CONTINUED MIGRATION --  CONTINUE DOWNWARDS CREATING NEW
//  AND SEPERATE FILES FOR TYPESCRIPT FOR CLEAN MERGING IN THE FUTURE

async function deleteMessage(req, res) {
  try {
    const authenticated = await authentication.compareSessionToken(
      req.cookies.sessionToken,
      req.body.id
    );
    const isAdmin = await authentication.checkAdminStatus(req.body.id);
    if (authenticated && isAdmin) {
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

module.exports = { deleteMessage };
