const { Router } = require("express");
const messagesRouter = Router();
const messagesController = require("../controllers/messagesController");

messagesRouter.get("/byChatName", messagesController.getChatMessagesByName);

module.exports = messagesRouter;
