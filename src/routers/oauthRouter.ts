import { Router } from 'express'
import oauthController from '../controllers/oauthController'

const oauthRouter = Router()

oauthRouter.patch('/', oauthController.oauthLogin)
oauthRouter.post('/signup', oauthController.oauthSignup)

export default oauthRouter
