import { Router } from 'express'
const messagesRouter = Router()
import messagesController from '../controllers/messagesController'

messagesRouter.get('/byChatName', messagesController.getChatMessagesByName)
messagesRouter.get('/userChats', messagesController.getUserChats)

export default messagesRouter
