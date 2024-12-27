const db = require("../db/queries");
//CLEAN THIS UP TO RETURN INFORMATION TO FRONT END IF DM MADE OR ALREADY THERE
//RETURN THE CONVERSATION ID TO THE FRONT END
//THEN SET UP WEBSOCKETS FOR DIRECT MESSAGES
async function checkDirectMessageConversation(req, res) {
    //CHECK IF PUBLIC OR PRIVATE ACCOUNT VIA QUERY
    //IF PRIVATE CHECK IF FRIENDS
    //ELSE DO THIS
    const userID = req.query.userID
    const profileID = req.query.profileID;
    console.log("You made it to checkDirectMessageConversation");
    const conversation_id = await db.checkDirectMessageConversationExists(userID, profileID);
    if (conversation_id) {
        res.status(200).json({ conversation_id: conversation_id })
    }
}

module.exports = {checkDirectMessageConversation}