const { Router } = require("express");
const conversationRouter = Router()
const conversationController = require("../controllers/conversationController");

conversationRouter.get("/", conversationController.checkDirectMessageConversation);
conversationRouter.post("/messageToConversation",conversationController.addMessageToConversations)
conversationRouter.get("/getOnlineUsers", conversationController.getOnlineUsers)
conversationRouter.get("/isBlocked", conversationController.checkIfBlockedByReciever)

module.exports = conversationRouter;