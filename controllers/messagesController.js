const db = require('../db/queries')
const authentication = require('../authentication')

async function getChatMessagesByName(req, res) {
  try {
    if (
      req.query.chatName &&
      req.query.chatName !== 'undefined' &&
      req.query.chatName !== 'null'
    ) {
      const messages = await db.getChatMessagesByName(req.query.chatName)

      const newMessages = await Promise.all(
        messages.map(async (message) => {
          const userObject = await db.getUserByUserID(message.sender_id)
          return {
            time: message.created_at,
            message: message.content,
            user: userObject.username,
          }
        }),
      )

      res.status(200).json({ messages: newMessages })
    } else if (req.query.conversationID !== 'undefined') {
      const sessionToken = req.cookies.sessionToken
      const isValid = await authentication.compareSessionToken(
        sessionToken,
        req.query.userID,
      )
      let checkID = req.query.userID
      let recieverID = null

      const messages = await db.getChatMessagesByConversationID(
        req.query.conversationID,
      )
      if (isValid) {
        const newMessages = await Promise.all(
          messages.map(async (message) => {
            const userObject = await db.getUserByUserID(message.sender_id)
            if (message.sender_id != req.query.userID) {
              recieverID = message.sender_id
            }
            return {
              time: message.created_at,
              message: message.content,
              user: userObject.username,
            }
          }),
        )

        if (recieverID) {
          await db.setIsRead(req.query.conversationID, recieverID)
        }
        res.status(200).json({ messages: newMessages })
      } else {
        throw new Error('No chat name or conversation ID detected')
      }
    } else {
      return {
        time: '',
        message: 'Attempt at invalid access to user direct messages',
        user: 'SystemMessage',
      }
    }
  } catch (err) {
    console.error('Error getting chat messages: ' + err.message)
  }
}

async function getUserChats(req, res) {
  try {
    const userChatsWithoutProfilePictures = await db.getUserChats(
      req.query.userID,
    )
    const userChats = await Promise.all(
      userChatsWithoutProfilePictures.map(async (chat) => {
        if (!chat.name && chat.participants.length === 1) {
          const profilePicture = await db.getProfilePictureURLByUserName(
            chat.participants[0],
          )
          return { ...chat, profilePicture: profilePicture }
        }
        return chat
      }),
    )

    res.status(200).json({ userChats: userChats })
  } catch (err) {
    console.error('Error getting user chats: ' + err.message)
    res.status(500).json({
      error: 'Error getting user chats',
      message: err.message,
    })
  }
}

module.exports = { getChatMessagesByName, getUserChats }
