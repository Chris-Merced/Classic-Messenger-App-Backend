import * as db from "../db/queries";
import { redisPublisher, redisSubscriber } from "../redisClient";
import {z } from "zod";
import type {Response, Request} from "express";
import { FriendsRow } from "../types/db";
import { checkErrorType } from "../authentication";

const QuerySchema = z.object({
  userID: z.coerce.number().int().positive(),
  profileID: z.coerce.number().int().positive()
})


async function checkDirectMessageConversation(req: Request, res: Response) {
  
  try {

    const parsed = QuerySchema.safeParse(req.query)

    if(!parsed.success){
      console.log(z.treeifyError(parsed.error))
      return res.status(400).json({error: z.treeifyError(parsed.error)})
    }

    const {userID, profileID} = parsed.data;
    

    const isPublic:boolean = await db.checkIfPublic(profileID);
    let areFriends: FriendsRow | false = false;

    if (!isPublic) {
      areFriends = await db.checkIfFriends(userID, profileID);
    }

    if (areFriends || isPublic) {
      console.log("You made it to checkDirectMessageConversation");
      const conversation_id: number = await db.checkDirectMessageConversationExists(
        userID,
        profileID
      );
      if (conversation_id) {
        res.status(200).json({ conversation_id: conversation_id });
      }
    }
  } catch (err) {
    const message = checkErrorType(err)
    console.log(
      "There was an error in checking direct message conversation: \n" + message
    );
    res.status(500).json({
      message: "There was an error in checking direct message conversation",
    });
  }
}

//CONTINUE HERE


async function addMessageToConversations(req, res) {
  try {
    const userID = req.body.reciever[0];
    const blockedUserID = req.body.userID;
    const { id } = await db.getUserByUsername(userID);
    const isBlocked = await db.checkIfBlocked(id, blockedUserID);

    if (!isBlocked) {
      await db.addMessageToConversations(JSON.stringify(req.body));
      res.status(200).json("Added message to database");
    } else {
      res
        .status(403)
        .json("You do not have permission to send a message to this user");
    }
  } catch (err) {
    console.error("Error adding message to conversation: " + err.message);
  }
}

async function getOnlineUsers(req, res) {
  try {
    var activeUsers = {};
    const userList = req.query.userList.split(",");

    for (let user of userList) {
      const response = await redisPublisher.hGet("activeUsers", user);
      const userExist = JSON.parse(response);
      if (userExist) {
        activeUsers[user] = true;
      } else {
        activeUsers[user] = false;
      }
    }
    res.status(200).json({ activeUsers });
  } catch (err) {
    console.log("Error in retrieving online users list: \n" + err);
    res.status(500).json({ message: "Error in retrieving online users list" });
  }
}

async function checkIfBlockedByReciever(req, res) {
  try {
    const userID = req.query.reciever;
    const blockedUserID = req.query.userID;
    const { id } = await db.getUserByUsername(userID);
    const isBlocked = await db.checkIfBlocked(id, blockedUserID);
    res.status(200).json(isBlocked);
  } catch (err) {
    console.log(
      "There was an error in checking if the user was blocked from chat messages" +
        err
    );
    res
      .status(500)
      .json({ message: "There was an error in checking user blocked status" });
  }
}

async function changeIsRead(req, res) {
  try {
    const response = await db.setIsRead(
      req.body.conversationID,
      req.body.senderID
    );
    res.status(200).json("isRead Status Changed Successfully");
  } catch (err) {
    console.log(
      "There was an error while attempting to change isRead status for conversation \n" +
        err.message
    );
    res.status(500).json("Could not change isRead status for conversation");
  }
}

module.exports = {
  checkDirectMessageConversation,
  addMessageToConversations,
  getOnlineUsers,
  checkIfBlockedByReciever,
  changeIsRead,
};
