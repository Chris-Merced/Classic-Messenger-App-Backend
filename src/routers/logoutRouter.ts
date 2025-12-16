import { Router } from 'express'
const logoutRouter = Router()
import logoutController from '../controllers/logoutController'

logoutRouter.delete('/', logoutController.logoutUser)

export default logoutRouter
