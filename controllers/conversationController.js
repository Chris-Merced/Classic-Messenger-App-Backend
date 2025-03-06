const db = require('../db/queries')
const{redisPublisher, redisSubscriber} = require('../redisClient')


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
  var activeUsers={};

  const userList=req.query.userList.split(',');

  for (user of userList){
    const response = await redisPublisher.hGet('activeUsers', user);
    const userExist = JSON.parse(response);
    if (userExist){
      activeUsers[user] = true;
    }else{activeUsers[user]=false}
  };
  res.status(200).json({activeUsers});

}

module.exports = {
  checkDirectMessageConversation,
  addMessageToConversations,
  getOnlineUsers,
}
