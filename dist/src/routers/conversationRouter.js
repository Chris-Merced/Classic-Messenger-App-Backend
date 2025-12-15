"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversationRouter = (0, express_1.Router)();
const conversationController_1 = __importDefault(require("../controllers/conversationController"));
conversationRouter.get('/', conversationController_1.default.checkDirectMessageConversation);
conversationRouter.post('/messageToConversation', conversationController_1.default.addMessageToConversations);
conversationRouter.get('/getOnlineUsers', conversationController_1.default.getOnlineUsers);
conversationRouter.get('/isBlocked', conversationController_1.default.checkIfBlockedByReciever);
conversationRouter.patch('/isRead', conversationController_1.default.changeIsRead);
exports.default = conversationRouter;
//# sourceMappingURL=conversationRouter.js.map