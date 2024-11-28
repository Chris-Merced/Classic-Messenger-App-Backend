const userProfileController = require('../controllers/userProfileController')
const { Router } = require('express');

const userProfileRouter = Router();

userProfileRouter.get('/', userProfileController.getUser);
userProfileRouter.get('/publicProfile', userProfileController.getUserPublicProfile);
userProfileRouter.get('/usersBySearch', userProfileController.getUsersBySearch)

module.exports = userProfileRouter; 