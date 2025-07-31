const db = require('../db/queries')
const authentication = require('../authentication')

async function deleteMessage(req, res) {
  try {
    const authenticated = authentication.compareSessionToken(
      req.cookies.sessionToken,
      req.body.id,
    )
    const isAdmin = authentication.checkAdminStatus(req.body.id)
    if (authenticated && isAdmin) {
      const success = await db.deleteMessage(req.body.messageID)
      if (success) {
        res.status(200).json('Message Deleted Successfully')
      } else {
        res.status(404).json('Message not found for deletion')
      }
    }
  } catch (err) {
    console.log("Error deleting message from database" +  err.message)
    res.status(500).json("Internal Server Error")
  }
}

module.exports = { deleteMessage }
