import loginController from '../controllers/loginController'
import { Router } from 'express'

const loginRouter = Router()

loginRouter.post('/', loginController.loginHandler)

export default loginRouter
