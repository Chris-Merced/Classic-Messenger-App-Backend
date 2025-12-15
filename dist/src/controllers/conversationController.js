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
exports.checkDirectMessageConversation = checkDirectMessageConversation;
exports.addMessageToConversations = addMessageToConversations;
exports.getOnlineUsers = getOnlineUsers;
exports.checkIfBlockedByReciever = checkIfBlockedByReciever;
exports.changeIsRead = changeIsRead;
const db = __importStar(require("../db/queries"));
const redisClient_1 = require("../redisClient");
const zod_1 = require("zod");
const authentication_1 = require("../authentication");
const QuerySchema = zod_1.z.object({
    userID: zod_1.z.coerce.number().int().positive(),
    profileID: zod_1.z.coerce.number().int().positive(),
});
async function checkDirectMessageConversation(req, res) {
    try {
        const parsed = QuerySchema.safeParse(req.query);
        if (!parsed.success) {
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({ error: zod_1.z.treeifyError(parsed.error) });
        }
        const { userID, profileID } = parsed.data;
        const isPublic = await db.checkIfPublic(profileID);
        let areFriends = false;
        if (!isPublic) {
            areFriends = await db.checkIfFriends(userID, profileID);
        }
        if (areFriends || isPublic) {
            console.log("You made it to checkDirectMessageConversation");
            const conversation_id = await db.checkDirectMessageConversationExists(userID, profileID);
            if (conversation_id) {
                res.status(200).json({ conversation_id: conversation_id });
            }
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error in checking direct message conversation: \n" + message);
        res.status(500).json({
            message: "There was an error in checking direct message conversation",
        });
    }
}
const AddMessageQuery = zod_1.z.object({
    userID: zod_1.z.coerce.number().int().positive(),
    reciever: zod_1.z.array(zod_1.z.coerce.string()),
});
async function addMessageToConversations(req, res) {
    try {
        const parsed = AddMessageQuery.safeParse(req.body);
        if (!parsed.success) {
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({ error: zod_1.z.treeifyError(parsed.error) });
        }
        const { userID: blockedUserID, reciever: [username], } = parsed.data;
        //Keeping original logic in for debugging later
        //const userID = req.body.reciever[0];
        //const blockedUserID = req.body.userID;
        const { id } = await db.getUserByUsername(username);
        const isBlocked = await db.checkIfBlocked(id, blockedUserID);
        if (!isBlocked) {
            await db.addMessageToConversations(JSON.stringify(req.body));
            res.status(200).json("Added message to database");
        }
        else {
            res
                .status(403)
                .json("You do not have permission to send a message to this user");
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.error("Error adding message to conversation: " + message);
        res.status(400).json({ error: "Error adding message to conversation" });
    }
}
async function getOnlineUsers(req, res) {
    try {
        var activeUsers = {};
        let userList = [];
        //Temporary explicit message for debugging later
        // to normalize behavior with frontend in edge case
        if (!req.query.userList) {
            console.log("No User List to parse");
            console.log("Error occured in: conversationController: getOnlineUsers");
            return res.status(404).json({ error: "No User List To Parse" });
        }
        if (typeof req.query.userList === "string") {
            userList = req.query.userList.split(",");
        }
        for (let user of userList) {
            const response = await redisClient_1.redisPublisher.hGet("activeUsers", user);
            if (typeof response === "string") {
                activeUsers[user] = true;
            }
            else {
                activeUsers[user] = false;
            }
            //keep original logic for debugging purposes later
            /*
            const userExist = JSON.parse(response);
            if (userExist) {
              activeUsers[user] = true;
            } else {
              activeUsers[user] = false;
            }
            */
        }
        res.status(200).json({ activeUsers });
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("Error in retrieving online users list: \n" + message);
        res.status(500).json({ message: "Error in retrieving online users list" });
    }
}
const CheckIfBlockedSchema = zod_1.z.object({
    reciever: zod_1.z.string(),
    userID: zod_1.z.coerce.number().int().positive(),
});
async function checkIfBlockedByReciever(req, res) {
    try {
        const parsed = CheckIfBlockedSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error checking blocked status: ");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(500).json({ error: zod_1.z.treeifyError(parsed.error) });
        }
        const { reciever: userID, userID: blockedUserID } = parsed.data;
        //keeping original logic for debugging later
        //const userID = req.query.reciever;
        //const blockedUserID = req.query.userID;
        const { id } = await db.getUserByUsername(userID);
        const isBlocked = await db.checkIfBlocked(id, blockedUserID);
        res.status(200).json(isBlocked);
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error in checking if the user was blocked from chat messages" +
            message);
        res
            .status(500)
            .json({ message: "There was an error in checking user blocked status" });
    }
}
const ChangeIsReadSchema = zod_1.z.object({
    conversationID: zod_1.z.coerce.number().int().positive(),
    senderID: zod_1.z.coerce.number().int().positive(),
});
async function changeIsRead(req, res) {
    try {
        const parsed = ChangeIsReadSchema.safeParse(req.body);
        if (!parsed.success) {
            console.log("Error in changing isRead status in controller: ");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(500).json({ error: zod_1.z.treeifyError(parsed.error) });
        }
        const { conversationID, senderID } = parsed.data;
        const response = await db.setIsRead(conversationID, senderID);
        //keeping original logic for debugging later
        /*
        );
        const response = await db.setIsRead(
          req.body.conversationID,
          req.body.senderID
        );
        */
        res.status(200).json("isRead Status Changed Successfully");
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error while attempting to change isRead status for conversation \n" +
            message);
        res
            .status(500)
            .json({ error: "Could not change isRead status for conversation" });
    }
}
exports.default = {
    checkDirectMessageConversation,
    addMessageToConversations,
    getOnlineUsers,
    checkIfBlockedByReciever,
    changeIsRead,
};
//# sourceMappingURL=conversationController.js.map