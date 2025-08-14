const userProfileController = require('../controllers/userProfileController')
const { Router } = require('express')
const upload = require('../middleware/multer')

const userProfileRouter = Router()

userProfileRouter.get('/', userProfileController.getUser)
userProfileRouter.get(
  '/publicProfile',
  userProfileController.getUserPublicProfile,
)
userProfileRouter.get('/usersBySearch', userProfileController.getUsersBySearch)
userProfileRouter.get('/userIDByUsername', userProfileController.getUserIDByUsername)
userProfileRouter.post('/friendRequest', userProfileController.addFriendRequest)
userProfileRouter.get('/friendRequest', userProfileController.getFriendRequests)
userProfileRouter.get('/friendRequestSent', userProfileController.checkFriendRequestSent)
userProfileRouter.post('/addFriend', userProfileController.addFriend)
userProfileRouter.delete('/denyFriend', userProfileController.denyFriend)
userProfileRouter.get('/checkIfFriends', userProfileController.checkIfFriends)
userProfileRouter.get('/getFriends', userProfileController.getFriends)
userProfileRouter.delete('/removeFriend', userProfileController.removeFriend)
userProfileRouter.post('/blockUser', userProfileController.blockUser)
userProfileRouter.get('/checkIfBlocked', userProfileController.checkIfBlocked)
userProfileRouter.delete('/unblockUser', userProfileController.unblockUser)
userProfileRouter.get(
  '/blockedByProfile',
  userProfileController.checkIfBlockedByProfile,
)
userProfileRouter.get('/profileStatus', userProfileController.checkIfPublic)
userProfileRouter.patch(
  '/changeProfileStatus',
  userProfileController.changeProfileStatus,
)
userProfileRouter.post(
  '/profilePicture',
  upload.single('ProfilePicture'),
  userProfileController.changeProfilePicture,
)
userProfileRouter.patch('/aboutMe', userProfileController.editAboutMe)
userProfileRouter.get('/mutualFriends', userProfileController.getMutualFriends)

module.exports = userProfileRouter
