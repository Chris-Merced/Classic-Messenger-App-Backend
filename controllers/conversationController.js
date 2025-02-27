const db = require('../db/queries')
const { redisPublisher, redisSubscriber } = require('../index')

async function checkDirectMessageConversation(req, res) {
  //CHECK IF PUBLIC OR PRIVATE ACCOUNT VIA QUERY
  //IF PRIVATE CHECK IF FRIENDS
  //ELSE DO THIS
  const userID = req.query.userID
  const profileID = req.query.profileID
  console.log('You made it to checkDirectMessageConversation')
  const conversation_id = await db.checkDirectMessageConversationExists(
    userID,
    profileID,
  )
  if (conversation_id) {
    res.status(200).json({ conversation_id: conversation_id })
  }
}

async function addMessageToConversations(req, res) {
  try {
    await db.addMessageToConversations(JSON.stringify(req.body))
    return true
  } catch (err) {
    console.error('Error adding message to conversation: ' + err.message)
  }
}

//REMEMBER THIS STILL EXISTS ONCE YOU HAVE FIGURED OUT BASE FUNCTIONALTIY CORRECTONS
async function getOnlineUsers(req, res) {
  console.log('checking query is met')
  console.log(req.query.userList)
}

module.exports = {
  checkDirectMessageConversation,
  addMessageToConversations,
  getOnlineUsers,
}
