const db = require('../db/queries')

async function getUser(req, res) {
  try {
    const sessionData = JSON.parse(req.cookies.sessionToken)

    if (sessionData.sessionID) {
      const userID = await db.getSessionBySessionID(sessionData.sessionID)
      if (!userID) {
        return res.status(401).json({ message: 'Invalid session ID' })
      }

      const user = await db.getUserByUserID(userID)
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      const { password, ...userWithoutPassword } = user
      res.status(200).json({ user: userWithoutPassword })
    } else {
      return res.status(401).json({ message: 'No SessionID Stored' })
    }
  } catch (err) {
    console.error('Error getting user from database: ' + err.message)
    res
      .status(500)
      .json({ message: 'Error getting user from database: ' + err.message })
  }
}

async function getUserPublicProfile(req, res) {
  try {
    const userData = await db.getUserByUserID(req.query.ID)
    const { password, email, is_admin, ...user } = userData
    res.status(200).json({ user: user })
  } catch (err) {
    console.error('Error Retrieving Profile: ', err)
    res.status(500).json({ message: 'Error: ' + err.message })
  }
}

async function getUsersBySearch(req, res) {
  try {
    const users = await db.getUsersByUsernameSearch(req.query.username)
    res.status(201).json({ users: users })
  } catch (err) {
    console.error('Error getting users during search' + err.message)
    res.status(404).json({
      message: 'There was a problem with the username lookup: ' + err.message,
    })
  }
}

async function addFriendRequest(req, res) {
  try {
    const userID = req.body.userID
    const profileID = req.body.profileID

    const response = await db.addFriendRequestToDatabase(userID, profileID)
    res.status(200).json({ message: response })
  } catch (err) {
    console.log(
      'There was an error adding Friend Request to Database: \n' + err,
    )
    res.status(500).json({
      message: 'There was an error adding Friend Request to Database:' + err,
    })
  }
}

async function getFriendRequests(req, res) {
  try {
    const userID = req.query.userID
    const data = await db.getFriendRequests(userID)
    res.status(200).json({ friendRequests: data })
  } catch (err) {
    console.log('Error while attempting to get Friend Requests: \n' + err)
    res.status(404).json({
      message: 'Error while attempting to get Friend Requests \n' + err,
    })
  }
}

async function addFriend(req, res) {
  try {
    const userID = req.body.userID
    const requestID = req.body.requestID

    const response = await db.addFriend(userID, requestID)
    res.status(200).json({ message: response })
  } catch (err) {
    console.log(
      'There was an error while attempting to add friend to database \n' + err,
    )
    res.status(500).json({
      message:
        'There was an error attempting to add friend to the database \n' + err,
    })
  }
}

async function denyFriend(req, res) {
  try {
    //swap values so that the users friend request 
    //is not deleted but the requesters friend request is
    const requestID = req.body.userID
    const userID = req.body.requestID

    await db.denyFriend(userID, requestID)
    res.status(200).json({message:"friend request denied"})
  } catch (err) {
    console.log('There was an error in denying a friend request \n' + err)
    res
      .status(500)
      .json({
        message: 'There was an error in denying a friend request \n' + err,
      })
  }
}

//NEED TO SET UP A FRIENDS LIST
//NEED TO SET IT UP TO WHERE IF USERS
//  ARE ALREADY FRIENDS THEY CANNOT SEND FRIEND REQUESTS

module.exports = {
  getUser,
  getUserPublicProfile,
  getUsersBySearch,
  addFriendRequest,
  getFriendRequests,
  addFriend,
  denyFriend,
}
