const { Router } = require('express')
const oauthController = require('../controllers/oauthController')

const oauthRouter = Router()

oauthRouter.patch('/', oauthController.createSession)





module.exports = oauthRouter