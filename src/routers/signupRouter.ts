import { Router } from 'express'
const signupRouter = Router()
import signupController from '../controllers/signupController'

signupRouter.post('/', signupController.signupHandler)

export default signupRouter
