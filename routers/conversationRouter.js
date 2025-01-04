const { Router } = require("express");
const conversationRouter = Router()
const conversationController = require("../controllers/conversationController");

conversationRouter.get("/", conversationController.checkDirectMessageConversation);
conversationRouter.post("/messageToConversation",conversationController.addMessageToConversations)

module.exports = conversationRouter;