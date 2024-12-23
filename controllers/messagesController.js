const db = require("../db/queries");

async function getChatMessagesByName(req, res) {
  try {
    if (req.query.chatName) {
      const messages = await db.getChatMessagesByName(req.query.chatName);

      const newMessages = await Promise.all(
        messages.map(async (message) => {
          const userObject = await db.getUserByUserID(message.sender_id);
          return {
            time: message.created_at,
            message: message.content,
            user: userObject.username,
          };
        })
      );

      res.status(200).json({ messages: newMessages });
    } else if (req.query.conversationID) {
      //MIDDLEWARE HERE TO CHECK AND CONFIRM THE SESSIONTOKEN AND THE USERID MATCHUP
      //IF SESSION IS AUTHORIZED SEND THROUGH
      //IF NOT REJECT AND SEND NOTHING
      
      const messages = await db.getChatMessagesByConversationID(req.query.conversationID);

      const newMessages = await Promise.all(
        messages.map(async (message) => {
          const userObject = await db.getUserByUserID(message.sender_id);
          return {
            time: message.created_at,
            message: message.content,
            user: userObject.username,
          };
        })
      );

      res.status(200).json({ messages: newMessages });
    } else {
      throw new Error("No chat name or conversation ID detected");
    }
  } catch (err) {
    console.error("Error getting chat messages: " + err.message);
    res.status(500).json({ message: "Error getting chat messages: " + err.message });
  }
}

async function getUserChats(req, res) {
  try {
    console.log("You made it to getUserChats " + req.query.userID);
    const userChats = await db.getUserChats(req.query.userID);
    res.status(200).json({ userChats: userChats });
  } catch (err) {
    console.error("Error getting user chats: " + err.message);
    res.status(500).json({
      error: "Error getting user chats",
      message: err.message,
    });
  }
}

module.exports = { getChatMessagesByName, getUserChats };
