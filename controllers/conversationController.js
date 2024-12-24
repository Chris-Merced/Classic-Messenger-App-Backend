const db = require("../db/queries");
//CLEAN THIS UP TO RETURN INFORMATION TO FRONT END IF DM MADE OR ALREADY THERE
//RETURN THE CONVERSATION ID TO THE FRONT END
//THEN SET UP WEBSOCKETS FOR DIRECT MESSAGES
async function checkDirectMessageConversation(req, res) {
    const userID = req.query.userID
    const profileID = req.query.profileID;
    console.log("You made it to checkDirectMessageConversation");
   const conversationExists = await db.checkDirectMessageConversationExists(userID, profileID);
}

module.exports = {checkDirectMessageConversation}