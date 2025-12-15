import { Router } from 'express'
const conversationRouter = Router()
import conversationController from '../controllers/conversationController'

conversationRouter.get(
  '/',
  conversationController.checkDirectMessageConversation,
)
conversationRouter.post(
  '/messageToConversation',
  conversationController.addMessageToConversations,
)
conversationRouter.get('/getOnlineUsers', conversationController.getOnlineUsers)
conversationRouter.get(
  '/isBlocked',
  conversationController.checkIfBlockedByReciever,
)
conversationRouter.patch('/isRead', conversationController.changeIsRead)

export default conversationRouter
