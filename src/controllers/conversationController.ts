import * as db from "../db/queries";
import { redisPublisher, redisSubscriber } from "../redisClient";
import { z } from "zod";
import type { Response, Request } from "express";
import { FriendsRow, UserRow } from "../types/db";
import { checkErrorType } from "../authentication";


const QuerySchema = z.object({
  userID: z.coerce.number().int().positive(),
  profileID: z.coerce.number().int().positive(),
});

async function checkDirectMessageConversation(req: Request, res: Response) {
  try {
    const parsed = QuerySchema.safeParse(req.query);

    if (!parsed.success) {
      console.log(z.treeifyError(parsed.error));
      return res.status(400).json({ error: z.treeifyError(parsed.error) });
    }

    const { userID, profileID } = parsed.data;

    const isPublic: boolean = await db.checkIfPublic(profileID);
    let areFriends: FriendsRow | false = false;

    if (!isPublic) {
      areFriends = await db.checkIfFriends(userID, profileID);
    }

    if (areFriends || isPublic) {
      console.log("You made it to checkDirectMessageConversation");
      const conversation_id: number =
        await db.checkDirectMessageConversationExists(userID, profileID);
      if (conversation_id) {
        res.status(200).json({ conversation_id: conversation_id });
      }
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "There was an error in checking direct message conversation: \n" + message
    );
    res.status(500).json({
      message: "There was an error in checking direct message conversation",
    });
  }
}

const AddMessageQuery = z.object({
  userID: z.coerce.number().int().positive(),
  reciever: z.array(z.coerce.string()),
});

async function addMessageToConversations(req: Request, res: Response) {
  try {
    const parsed = AddMessageQuery.safeParse(req.body);

    if (!parsed.success) {
      console.log(z.treeifyError(parsed.error));
      return res.status(400).json({ error: z.treeifyError(parsed.error) });
    }

    const {
      userID: blockedUserID,
      reciever: [username],
    } = parsed.data;

    //Keeping original logic in for debugging later
    //const userID = req.body.reciever[0];
    //const blockedUserID = req.body.userID;

    const { id }: Pick<UserRow, "id"> = await db.getUserByUsername(username);
    const isBlocked: boolean = await db.checkIfBlocked(id, blockedUserID);

    if (!isBlocked) {
      await db.addMessageToConversations(JSON.stringify(req.body));
      res.status(200).json("Added message to database");
    } else {
      res
        .status(403)
        .json("You do not have permission to send a message to this user");
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error adding message to conversation: " + message);
    res.status(400).json({ error: "Error adding message to conversation" });
  }
}

export async function getOnlineUsers(req: Request, res: Response) {
  try {
    var activeUsers: Record<string, boolean> = {};
    let userList: Array<string> = [];

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
      const response: string | undefined = await redisPublisher.hGet(
        "activeUsers",
        user
      );

      if (typeof response === "string") {
        activeUsers[user] = true;
      } else {
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
  } catch (err) {
    const message = checkErrorType(err);
    console.log("Error in retrieving online users list: \n" + message);
    res.status(500).json({ message: "Error in retrieving online users list" });
  }
}

const CheckIfBlockedSchema = z.object({
  reciever: z.string(),
  userID: z.coerce.number().int().positive(),
});

export async function checkIfBlockedByReciever(req: Request, res: Response) {
  try {
    const parsed = CheckIfBlockedSchema.safeParse(req.query);
    if (!parsed.success) {
      console.log("Error checking blocked status: ");
      console.log(z.treeifyError(parsed.error));
      return res.status(500).json({ error: z.treeifyError(parsed.error) });
    }
    const { reciever: userID, userID: blockedUserID } = parsed.data;

    //keeping original logic for debugging later
    //const userID = req.query.reciever;
    //const blockedUserID = req.query.userID;

    const { id } = await db.getUserByUsername(userID);
    const isBlocked = await db.checkIfBlocked(id, blockedUserID);
    res.status(200).json(isBlocked);
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "There was an error in checking if the user was blocked from chat messages" +
        message
    );
    res
      .status(500)
      .json({ message: "There was an error in checking user blocked status" });
  }
}

const ChangeIsReadSchema = z.object({
  conversationID: z.coerce.number().int().positive(),
  senderID: z.coerce.number().int().positive(),
});

export async function changeIsRead(req: Request, res: Response) {
  try {
    const parsed = ChangeIsReadSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log("Error in changing isRead status in controller: ");
      console.log(z.treeifyError(parsed.error));
      return res.status(500).json({ error: z.treeifyError(parsed.error) });
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
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "There was an error while attempting to change isRead status for conversation \n" +
        message
    );
    res
      .status(500)
      .json({ error: "Could not change isRead status for conversation" });
  }
}

module.exports = {
  checkDirectMessageConversation,
  addMessageToConversations,
  getOnlineUsers,
  checkIfBlockedByReciever,
  changeIsRead,
};
