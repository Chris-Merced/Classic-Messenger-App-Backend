"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messagesRouter = (0, express_1.Router)();
const messagesController_1 = __importDefault(require("../controllers/messagesController"));
messagesRouter.get('/byChatName', messagesController_1.default.getChatMessagesByName);
messagesRouter.get('/userChats', messagesController_1.default.getUserChats);
exports.default = messagesRouter;
//# sourceMappingURL=messagesRouter.js.map