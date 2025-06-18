const db = require('../db/queries')
const authentication = require('../authentication')
const fileType = require('file-type')
const s3 = require('../utils/s3Uploader')
const sharp = require('sharp')
const crypto = require('crypto')

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
    const page = req.query.page
    const limit = req.query.limit

    const users = await db.getUsersByUsernameSearch(
      req.query.username,
      page,
      limit,
    )
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
    const sessionToken = req.cookies.sessionToken

    const authenticated = await authentication.compareSessionToken(
      sessionToken,
      req.query.userID,
    )
    if (authenticated) {
      const userID = req.query.userID
      const data = await db.getFriendRequests(userID)
      res.status(200).json({ friendRequests: data })
    } else {
      res.status(403).json('You Do Not Have Permission To View This Data')
    }
  } catch (err) {
    console.log('Error while attempting to get Friend Requests: \n' + err)
    res.status(404).json({
      message: 'Error while attempting to get Friend Requests \n' + err,
    })
  }
}

async function checkFriendRequestSent(req, res){
  req
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
    const isPublic = await db.checkIfPublic(req.query.profileID)
    res.status(200).json(isPublic)
  } catch (err) {
    console.log('There was an error in checking profile status' + err)
    return res
      .status(500)
      .json({ message: 'There was an error in checking profile status' })
  }
}

async function changeProfileStatus(req, res) {
  try {
    const sessionToken = req.cookies.sessionToken
    const authenticated = await authentication.compareSessionToken(
      sessionToken,
      req.body.userID,
    )
    if (authenticated) {
      const response = await db.changeProfileStatus(
        req.body.userID,
        req.body.status,
      )
      res.status(200).json({ message: 'Profile Status Changed', changed: true })
    } else {
      return res.status(403).json({
        message: 'You do not have permission to modify this value',
        changed: false,
      })
    }
  } catch (err) {
    console.log('There was an error in changing the profile status: \n' + err)
    return res.status(500).json({
      message: 'There was an error in changing the profile status',
      changed: false,
    })
  }
}

async function changeProfilePicture(req, res) {
  try {
    const sessionToken = req.cookies.sessionToken

    const authenticated = await authentication.compareSessionToken(
      sessionToken,
      req.body.userID,
    )

    if (authenticated) {
      const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp']

      if (!req.file || !req.file.buffer) {
        return res.status(400).json('No File Was Uploaded')
      }

      const newFile = await fileType.fromBuffer(req.file.buffer)

      if (!validTypes.includes(newFile.mime)) {
        console.log('Invalid Profile Picture Type, Not Supported')
        return res.status(400).json('File Type Not Supported')
      }

      const processedImageBuffer = await sharp(req.file.buffer)
        .resize(512, 512)
        .toFormat('jpeg')
        .jpeg({ quality: 80 })
        .toBuffer()

      const key = `profile-pictures/${req.body.userID}-${crypto.randomUUID()}.jpeg`

      const profilePictureUrlObject = await db.getProfilePictureURL(
        req.body.userID,
      )
      const imageUrl = await s3.uploadToS3(
        processedImageBuffer,
        key,
        'image/jpeg',
      )
      const response = await db.addProfilePictureURL(imageUrl, req.body.userID)

      if (profilePictureUrlObject && profilePictureUrlObject.profile_picture) {
        const profilePictureUrl = profilePictureUrlObject.profile_picture
        const url = new URL(profilePictureUrl)
        const deleteKey = decodeURIComponent(url.pathname.substring(1))

        s3.deleteFromS3(deleteKey)
      }
      return res
        .status(200)
        .json({ response: response.message, pictureURL: response.url })
    } else {
      return res
        .status(403)
        .json('You do not have the permission to edit this profile')
    }
  } catch (err) {
    console.log(
      'userProfileController: \n changeProfilePicture: There was an error in changing the profile Picture' +
        err,
    )
    res.status(500).json('There was an error in changing profile picture.')
  }
}

async function editAboutMe(req, res) {
  try {
    const authenticated = await authentication.compareSessionToken(
      req.cookies.sessionToken,
      req.body.userID,
    )
    if (authenticated) {
      const aboutMe = req.body.aboutMe
      const response = await db.editAboutMe(aboutMe, req.body.userID)
      res.status(200).json('About Me Section Edit Successful')
    } else {
      console.log('User does not have permission for this modification')
      res
        .status(401)
        .json('User Does not have permission for this modification')
    }
  } catch (err) {
    console.log("There was an error in changing the user's about me section")
    res.status(500).json('Could not change about me section')
  }
}

async function getMutualFriends(req, res){
  try{
    const userID = req.query.userID
    const profileID = req.query.profileID
    console.log(userID)
    console.log(profileID)
    const data =  await db.getMutualFriends(userID, profileID)

    res.status(200).json(data)
  }catch(err){
    console.log("There was an error in retrieving mutual friends: \n" + err)
    res.status(500).json("Could not retrieve mutual friends")
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
  changeProfilePicture,
  editAboutMe,
  getMutualFriends,
}
