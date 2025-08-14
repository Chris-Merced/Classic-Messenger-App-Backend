const { Router } = require('express')
const logoutRouter = Router()
const logoutController = require('../controllers/logoutController')

logoutRouter.delete('/', logoutController.logoutUser)

module.exports = logoutRouter
