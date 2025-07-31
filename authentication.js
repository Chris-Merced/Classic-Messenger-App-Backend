const db = require('./db/queries')

async function compareSessionToken(token, userID) {
  try {
    const isValid = await db.checkSession(token, userID)
    if (isValid) {
      return true
    } else {
      return false
    }
  } catch (err) {
    console.error('Error authenticating user: ' + err.message)
  }
}

async function checkAdminStatus(id) {
  try {
    const adminStatus = await db.checkAdminStatus(id)
    if (adminStatus) {
      return true
    } else {
      return false
    }
  } catch (err) {
    console.log('Error verifying admin status' + err.message)
    return false
  }
}

module.exports = { compareSessionToken, checkAdminStatus }
