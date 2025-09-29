const db = require('../db/queries')
const authentication = require('../authentication')

async function deleteMessage(req, res) {
  try {
    const authenticated = await authentication.compareSessionToken(
      req.cookies.sessionToken,
      req.body.id,
    )
    if (authenticated) {
      const success = await db.deleteMessage(req.body.messageID)
      if (success) {
        res.status(200).json('Message Deleted Successfully')
      } else {
        res.status(404).json('Message not found for deletion')
      }
    } else {
      res.status(403).json('Unauthorized Action')
    }
  } catch (err) {
    console.log('Error deleting message from database' + err.message)
    res.status(500).json('Internal Server Error')
  }
}

async function banUser(req, res){
  const days = req.query.days
  const username = req.query.username
}

module.exports = { deleteMessage, banUser }
