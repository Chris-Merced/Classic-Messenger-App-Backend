const db = require("../db/queries");

async function getChatMessagesByName(req, res) {
  try {
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
  } catch (err) {
    res.status(401).json({ message: "Error" + err.message });
  }
}

module.exports = { getChatMessagesByName };
