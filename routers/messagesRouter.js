const { Router } = require('express')
const messagesRouter = Router()
const messagesController = require('../controllers/messagesController')

messagesRouter.get('/byChatName', messagesController.getChatMessagesByName)
messagesRouter.get('/userChats', messagesController.getUserChats)

module.exports = messagesRouter
