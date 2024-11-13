const userProfileController = require('../controllers/userProfileController')
const { Router } = require('express');

const userProfileRouter = Router();

userProfileRouter.get('/', userProfileController.getUser);

module.exports = userProfileRouter; 