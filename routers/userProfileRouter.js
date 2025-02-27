const userProfileController = require('../controllers/userProfileController')
const { Router } = require('express')

const userProfileRouter = Router()

userProfileRouter.get('/', userProfileController.getUser)
userProfileRouter.get('/publicProfile', userProfileController.getUserPublicProfile)
userProfileRouter.get('/usersBySearch', userProfileController.getUsersBySearch)
userProfileRouter.post('/friendRequest', userProfileController.addFriendRequest)
userProfileRouter.get('/friendRequest', userProfileController.getFriendRequests)
userProfileRouter.post('/addFriend', userProfileController.addFriend)
userProfileRouter.delete('/denyFriend', userProfileController.denyFriend)
userProfileRouter.get('/checkIfFriends', userProfileController.checkIfFriends)
userProfileRouter.get('/getFriends', userProfileController.getFriends)

module.exports = userProfileRouter
