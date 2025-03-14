const db = require('../db/queries')
const { redisPublisher, redisSubscriber } = require('../redisClient')

async function checkDirectMessageConversation(req, res) {
  try {
    const userID = req.query.userID
    const profileID = req.query.profileID
    const isPublic = await db.checkIfPublic(profileID)
    let areFriends = false

    if (!isPublic) {
      areFriends = await db.checkIfFriends(userID, profileID)
    }

    if (areFriends || isPublic) {
      console.log('You made it to checkDirectMessageConversation')
      const conversation_id = await db.checkDirectMessageConversationExists(
        userID,
        profileID,
      )
      if (conversation_id) {
        res.status(200).json({ conversation_id: conversation_id })
      }
    }
  } catch (err) {
    console.log(
      'There was an error in checking direct message conversation: \n' + err,
    )
    res
      .status(500)
      .json({
        message: 'There was an error in checking direct message conversation',
      })
  }
}

async function addMessageToConversations(req, res) {
  try {
    const userID = req.body.reciever[0]
    const blockedUserID = req.body.userID
    const { id } = await db.getUserByUsername(userID)
    const isBlocked = await db.checkIfBlocked(id, blockedUserID)

    if (!isBlocked) {
      await db.addMessageToConversations(JSON.stringify(req.body))
      return
    } else {
      return
    }
  } catch (err) {
    console.error('Error adding message to conversation: ' + err.message)
  }
}

async function getOnlineUsers(req, res) {
  var activeUsers = {}

  const userList = req.query.userList.split(',')

  for (user of userList) {
    const response = await redisPublisher.hGet('activeUsers', user)
    const userExist = JSON.parse(response)
    if (userExist) {
      activeUsers[user] = true
    } else {
      activeUsers[user] = false
    }
  }
  res.status(200).json({ activeUsers })
}

async function checkIfBlockedByReciever(req, res) {
  try {
    const userID = req.query.reciever
    const blockedUserID = req.query.userID
    const { id } = await db.getUserByUsername(userID)
    const isBlocked = await db.checkIfBlocked(id, blockedUserID)
    console.log(isBlocked)
    res.status(200).json(isBlocked)
  } catch (err) {
    console.log(
      'There was an error in checking if the user was blocked from chat messages' +
        err,
    )
    res
      .status(500)
      .json({ message: 'There was an error in checking user blocked status' })
  }
}

module.exports = {
  checkDirectMessageConversation,
  addMessageToConversations,
  getOnlineUsers,
  checkIfBlockedByReciever,
}
