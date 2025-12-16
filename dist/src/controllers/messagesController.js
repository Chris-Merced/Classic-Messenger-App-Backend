"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatMessagesByName = getChatMessagesByName;
exports.getUserChats = getUserChats;
const db = __importStar(require("../db/queries"));
const authentication = __importStar(require("../authentication"));
const authentication_1 = require("../authentication");
const zod_1 = require("zod");
const GetChatMessagesSchema = zod_1.z.object({
    chatName: zod_1.z.string(),
    conversationID: zod_1.z.coerce.number().int().positive().optional(),
    userID: zod_1.z.coerce.number().int().optional(),
    page: zod_1.z.coerce.number().int().nonnegative(),
    limit: zod_1.z.coerce.number().int().positive(),
});
async function getChatMessagesByName(req, res) {
    try {
        const parsed = GetChatMessagesSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error in req params for chat messages");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(500).json({ error: zod_1.z.treeifyError(parsed.error) });
        }
        const { chatName, conversationID, userID, page, limit } = parsed.data;
        //if condition needs to be changed along with front end:
        // frontend needs to have a normalized falsy value when chatName is not present
        // so that the if condition is less verbose and easily readable
        if (chatName && chatName !== "undefined" && chatName !== "null") {
            const messages = await db.getChatMessagesByName(chatName, page, limit);
            const userWithoutPasswordSchema = zod_1.z.object({
                id: zod_1.z.number(),
                username: zod_1.z.string(),
                email: zod_1.z.string(),
                is_admin: zod_1.z.boolean().nullable(),
                created_at: zod_1.z.date().nullable(),
                is_public: zod_1.z.boolean().nullable(),
                profile_picture: zod_1.z.string().nullable(),
                about_me: zod_1.z.string().nullable(),
            });
            const newMessages = await Promise.all(messages.map(async (message) => {
                const userObject = await db.getUserByUserID(message.sender_id);
                return {
                    id: message.id,
                    time: message.created_at,
                    message: message.content,
                    user: userObject.username,
                };
            }));
            res.status(200).json({ messages: newMessages });
        }
        else if (req.query.conversationID) {
            if (!userID) {
                console.log("UserID is not available for authentication");
                return res.status(400).json({ error: "User ID not present for authentication" });
            }
            if (!conversationID) {
                console.log("ConversationID is not available for authentication");
                return res.status(400).json({ error: "ConversationID not present for authentication" });
            }
            const sessionToken = req.cookies.sessionToken;
            const isValid = await authentication.compareSessionToken(sessionToken, userID);
            let checkID = userID;
            const messages = await db.getChatMessagesByConversationID(conversationID, page, limit);
            if (isValid) {
                const newMessages = await Promise.all(messages.map(async (message) => {
                    const userObject = await db.getUserByUserID(message.sender_id);
                    return {
                        id: message.id,
                        time: message.created_at,
                        message: message.content,
                        user: userObject.username,
                    };
                }));
                const recieverIDReal = await db.getUserIDByConversationID(conversationID, userID);
                if (!recieverIDReal) {
                    return res
                        .status(403)
                        .json({ error: "You do not have permission to access this data" });
                }
                res
                    .status(200)
                    .json({ recieverID: recieverIDReal, messages: newMessages });
            }
            else {
                throw new Error("No chat name or conversation ID detected");
            }
        }
        else {
            return {
                time: "",
                message: "Attempt at invalid access to user direct messages",
                user: "SystemMessage",
            };
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.error("Error getting chat messages: " + message);
        res.status(500).json({ error: "Could not retrieve chat messages" });
    }
}
const GetUserChatsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().nonnegative(),
    limit: zod_1.z.coerce.number().int().positive(),
    userID: zod_1.z.coerce.number().int().positive(),
});
async function getUserChats(req, res) {
    try {
        const parsed = GetUserChatsSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error parsing request object for getUserChats");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(500).json({ error: zod_1.z.treeifyError(parsed.error) });
        }
        const { page, limit, userID } = parsed.data;
        const userChatsWithoutProfilePictures = await db.getUserChats(userID, page, limit);
        const userChats = await Promise.all(userChatsWithoutProfilePictures.map(async (chat) => {
            if (!chat.name && chat.participants.length === 1) {
                const profilePicture = await db.getProfilePictureURLByUserName(chat.participants[0]);
                return { ...chat, profilePicture: profilePicture };
            }
            return chat;
        }));
        res.status(200).json({ userChats: userChats });
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.error("Error getting user chats: " + message);
        res.status(500).json({
            error: "Error getting user chats",
            message: message,
        });
    }
}
exports.default = { getChatMessagesByName, getUserChats };
//# sourceMappingURL=messagesController.js.map