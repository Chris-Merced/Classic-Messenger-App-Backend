const { Router } = require('express')
const oauthController = require('../controllers/oauthController')

const oauthRouter = Router()

oauthRouter.patch('/', oauthController.oauthLogin)
oauthRouter.post('/signup', oauthController.oauthSignup)

module.exports = oauthRouter
