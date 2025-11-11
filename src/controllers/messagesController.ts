import * as db from "../db/queries";
import * as authentication from "../authentication";
import { checkErrorType } from "../authentication";
import { Request, Response } from "express";
import { z } from "zod";
import { MessagesRow } from "../types/db";

const GetChatMessagesSchema = z.object({
  chatName: z.string(),
  conversationID: z.coerce.number(),
  userID: z.coerce.number(),
  page: z.coerce.number(),
  limit: z.coerce.number(),
});

export async function getChatMessagesByName(req: Request, res: Response) {
  try {
    const parsed = GetChatMessagesSchema.safeParse(req);

    if (!parsed.success) {
      console.log("Error in req params for chat messages");
      console.log(z.treeifyError(parsed.error));
      return res.status(500).json({ error: z.treeifyError(parsed.error) });
    }

    const { chatName, conversationID, userID, page, limit } = parsed.data;

    //if condition needs to be changed along with front end:
    // frontend needs to have a normalized falsy value when chatName is not present
    // so that the if condition is less verbose and easily readable
    if (chatName && chatName !== "undefined" && chatName !== "null") {
      const messages: MessagesRow[] = await db.getChatMessagesByName(chatName, page, limit);

      const userWithoutPasswordSchema = z.object({
        id: z.number(),
        username: z.string(),
        email: z.string(),
        is_admin: z.boolean().nullable(),
        created_at: z.date().nullable(),
        is_public: z.boolean().nullable(),
        profile_picture: z.string().nullable(),
        about_me: z.string().nullable(),
      });
      type userWithoutPassword = z.infer<typeof userWithoutPasswordSchema>;

      const newMessages = await Promise.all(
        messages.map(async (message) => {
          const userObject: userWithoutPassword = await db.getUserByUserID(
            message.sender_id
          );
          return {
            id: message.id,
            time: message.created_at,
            message: message.content,
            user: userObject.username,
          };
        })
      );

      res.status(200).json({ messages: newMessages });
    } else if (req.query.conversationID) {
      const sessionToken: string = req.cookies.sessionToken;
      const isValid: boolean = await authentication.compareSessionToken(
        sessionToken,
        userID
      );
      let checkID = userID;

      const messages = await db.getChatMessagesByConversationID(
        conversationID,
        page,
        limit
      );
      if (isValid) {
        const newMessages = await Promise.all(
          messages.map(async (message) => {
            const userObject = await db.getUserByUserID(message.sender_id);
            return {
              id: message.id,
              time: message.created_at,
              message: message.content,
              user: userObject.username,
            };
          })
        );

        const recieverIDReal = await db.getUserIDByConversationID(
          conversationID,
          userID
        );

        if (!recieverIDReal){
          return res.status(403).json({error: "You do not have permission to access this data"})
        }

        res
          .status(200)
          .json({ recieverID: recieverIDReal, messages: newMessages });
      } else {
        throw new Error("No chat name or conversation ID detected");
      }
    } else {
      return {
        time: "",
        message: "Attempt at invalid access to user direct messages",
        user: "SystemMessage",
      };
    }
  } catch (err) {
    const message = checkErrorType(err)
    console.error("Error getting chat messages: " + message);
    res.status(500).json({error: "Could not retrieve chat messages"})
  }
}

async function getUserChats(req, res) {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const userID = req.query.userID;

    const userChatsWithoutProfilePictures = await db.getUserChats(
      userID,
      page,
      limit
    );
    const userChats = await Promise.all(
      userChatsWithoutProfilePictures.map(async (chat) => {
        if (!chat.name && chat.participants.length === 1) {
          const profilePicture = await db.getProfilePictureURLByUserName(
            chat.participants[0]
          );
          return { ...chat, profilePicture: profilePicture };
        }
        return chat;
      })
    );

    res.status(200).json({ userChats: userChats });
  } catch (err) {
    console.error("Error getting user chats: " + err.message);
    res.status(500).json({
      error: "Error getting user chats",
      message: err.message,
    });
  }
}

module.exports = { getChatMessagesByName, getUserChats };
