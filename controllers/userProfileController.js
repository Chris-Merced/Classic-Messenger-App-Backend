const db = require('../db/queries')
const authentication = require('../authentication')

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
    res.status(200).json({ message: 'friend request denied' })
  } catch (err) {
    console.log('There was an error in denying a friend request \n' + err)
    res.status(500).json({
      message: 'There was an error in denying a friend request \n' + err,
    })
  }
}

async function removeFriend(req, res) {
  try {
    db.removeFriend(req.body.userID, req.body.friendID)
    res.status(200).json({ message: 'You did it' })
  } catch (err) {
    console.log('Error while attempting to remove friend: \n' + err)
    res
      .status(500)
      .json({ message: 'Error attempting to remove friend from database' })
  }
}

async function checkIfFriends(req, res) {
  try {
    const userID = req.query.userID
    const friendID = req.query.friendID
    const friendRow = await db.checkIfFriends(userID, friendID)

    if (friendRow) {
      res.status(200).json({ friendStatus: true })
    } else {
      res.status(200).json({ friendStatus: false })
    }
  } catch (err) {
    console.log(
      'There was an error in checking friend status in controller \n' + err,
    )
    res
      .status(500)
      .json({ message: 'There was an error checking friend status \n' + err })
  }
}

async function getFriends(req, res) {
  try {
    const friendIDs = await db.getFriends(req.query.userID)
    const userData = await Promise.all(
      friendIDs.map(async (ID) => {
        return await db.getUserByUserID(ID)
      }),
    )

    const friendsList = userData.map((user) => {
      const { password, email, is_admin, ...newUser } = user
      return newUser
    })

    res.status(200).json({ friendsList })
  } catch (err) {
    console.log('Error retrieving user friends: \n' + err)
    res.status(404).json({ message: 'Error retrieving user friends: \n' + err })
  }
}

async function blockUser(req, res) {
  try {
    db.blockUser(req.body.userID, req.body.blockedID)
    res.status(200).json({ message: 'Successfully Blocked User' })
  } catch (err) {
    console.log('Error in blocking user:  \n' + err)
    res
      .status(500)
      .json({ message: 'There was an error in blocking user to database' })
  }
}

async function checkIfBlocked(req, res) {
  try {
    const isBlocked = await db.checkIfBlocked(
      req.query.userID,
      req.query.blockedID,
    )
    res.status(200).json({ isBlocked: isBlocked })
  } catch (err) {
    console.log('There was an error while checking blocked status' + err)
    res
      .status(500)
      .json({ message: 'There was an error while checking blocked status' })
  }
}

async function unblockUser(req, res) {
  try {
    db.unblockUser(req.body.userID, req.body.unblockedID)
    res.status(200).json({ message: 'Unblocked user' })
  } catch (err) {
    console.log('Error in unblocking user: \n' + err)
    res.status(500).json({ message: 'Error in unblocking user' })
  }
}

async function checkIfBlockedByProfile(req, res) {
  try {
    const userID = req.query.profileID
    const blockedID = req.query.userID

    const isBlockedByProfile = await db.checkIfBlocked(userID, blockedID)
    res.status(200).json(isBlockedByProfile)
  } catch (err) {
    console.log('There was an error in checking blocked status: \n' + err)
    res
      .status(500)
      .json({ message: 'There was an error in checking blocked status' })
  }
}

async function checkIfPublic(req, res) {
  try {
    console.log('Made it to check if public')
    console.log(req.query.profileID)
    const isPublic = await db.checkIfPublic(req.query.profileID)
    res.status(200).json(isPublic)
  } catch (err) {
    console.log('There was an error in checking profile status' + err)
    res
      .status(500)
      .json({ message: 'There was an error in checking profile status' })
  }
}

async function changeProfileStatus(req, res) {
  
  try{const sessionToken = JSON.parse(req.cookies.sessionToken).sessionID;
  
  const authenticated = authentication.compareSessionToken(
    sessionToken,
    req.body.userID,
  )
  if (authenticated){
    const response = await db.changeProfileStatus(req.body.userID, req.body.status)
     res.status(200).json({message: "Profile Status Changed", changed:true})
  }else{response.status(403).json({message: "You do not have permission to modify this value", changed: false})}
  }catch(err){
    console.log("There was an error in changing the profile status: \n" + err)
    res.status(500).json({message: "There was an error in changing the profile status", changed: false})
  }
}

module.exports = {
  getUser,
  getUserPublicProfile,
  getUsersBySearch,
  addFriendRequest,
  getFriendRequests,
  addFriend,
  denyFriend,
  checkIfFriends,
  getFriends,
  removeFriend,
  blockUser,
  unblockUser,
  checkIfBlocked,
  checkIfBlockedByProfile,
  checkIfPublic,
  changeProfileStatus,
}
