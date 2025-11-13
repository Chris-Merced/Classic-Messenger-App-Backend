import pool from "./pool";
import {
  UserRow,
  SessionsRow,
  ConversationsRow,
  ConversationParticipantsRow,
  MessagesRow,
  FriendRequestsRow,
  FriendsRow,
  BlockedRow,
} from "../types/db";
import argon2 from "argon2";
import { z } from "zod";
import { checkErrorType } from "../authentication";
import type { Query, QueryResult } from "pg";
import type { Request, Response } from "express";

// TODO: Do each function one by one and we'll connect routes after all of
//       queries is done -
//       - Start after GetUsersByUsernameSearch
const UserInputSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
});
export type UserInput = z.infer<typeof UserInputSchema>;

type UserNameRow = { username: string };
type UserEmailRow = { email: string };
type UserIDRow = { id: number };



export async function addUser(user: UserInput) {
  console.log("NEW TYPED ROUTE");
  try {
    const userData = UserInputSchema.parse(user);

    let userNameData: QueryResult<UserRow> = await pool.query(
      "SELECT * FROM users WHERE username ILIKE $1",
      [userData.username.trim()]
    );
    if (
      userNameData.rows[0] &&
      userNameData.rows[0].username.toLowerCase() ===
        user.username.trim().toLowerCase()
    ) {
      console.log("User Already Exists");
      throw new Error("User Already Exists");
    }

    let emailData: QueryResult<UserRow> = await pool.query(
      "SELECT * FROM users WHERE LOWER(email)=LOWER($1)",
      [user.email.trim()]
    );

    if (emailData.rows[0]) {
      console.log("Email already in use");
      throw new Error("Email Already In Use");
    }

    await pool.query(
      "INSERT INTO users (username,password, email) VALUES ($1, $2, $3)",
      [user.username.trim(), user.password, user.email.trim().toLowerCase()]
    );
    const id: number | void = await getUserIDByUsername(user.username.trim());

    if (id) {
      await addParticipant(1, id);
    }
    return;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("Error attempting to add user: \n" + message);
    throw new Error(message);
  }
}

export async function getUserIDByUsername(
  username: string
): Promise<number | void> {
  try {
    const { rows }: QueryResult<UserIDRow> = await pool.query(
      "SELECT id FROM users WHERE LOWER(username)=LOWER($1)",
      [username.toLowerCase()]
    );
    if (rows[0]) {
      return rows[0].id;
    } else {
      console.log("Within getUserIDByUsername: \n Username does not exist");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(
      "There was an error in retrieving User ID By Username: \n" + message
    );
  }
}

export async function addParticipant(conversation_id: number, user_id: number) {
  try {
    await pool.query(
      "INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)",
      [conversation_id, user_id]
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error adding participant to conversation: \n" + message);
    throw new Error("Error adding participant to conversation: \n" + message);
  }
}

export async function addUserOAuth(
  email: string,
  username: string
): Promise<number> {
  try {
    const tempPassword: string = crypto.randomUUID();
    const hashedPassword: string = await argon2.hash(tempPassword);

    await pool.query(
      "INSERT INTO users (username,password, email) VALUES ($1, $2, $3)",
      [username.trim(), hashedPassword, email.trim().toLowerCase()]
    );
    const id: number | void = await getUserIDByUsername(username.trim());
    if (id) {
      await addParticipant(1, id);
    } else {
      throw new Error("Could not find user ID by Username");
    }
    return id;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("Error adding user to database via OAuth method: \n" + message);
    throw new Error(
      "Error adding user to database via OAuth method: \n" + message
    );
  }
}

export async function getUserByUsername(username: string): Promise<UserRow> {
  try {
    const { rows }: QueryResult<UserRow> = await pool.query(
      "SELECT * FROM users WHERE LOWER(username)=LOWER($1) ",
      [username]
    );
    const user: UserRow = rows[0];
    return user;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error getting user by username: \n" + message);
    throw new Error("Error getting user by username: \n" + message);
  }
}

const GetUserByUsernameSchema = z.object({
  id: z.number(),
  username: z.string(),
});
export type GetUserByUsernameResult = z.infer<typeof GetUserByUsernameSchema>;

const searchInputSchema = z.object({
  username: z.string(),
  page: z.number().nonnegative().int(),
  limit: z.number().nonnegative().int(),
});

export async function getUsersByUsernameSearch(
  username: string,
  page: number,
  limit: number
): Promise<GetUserByUsernameResult[]> {
  try {
    const {
      username: q,
      page: p,
      limit: l,
    } = searchInputSchema.parse({ username, page, limit });

    const offset: number = p * l;

    const { rows }: QueryResult<UserRow> = await pool.query(
      "SELECT * FROM USERS WHERE username ILIKE $1 LIMIT $2 OFFSET $3",
      [`%${q}%`, l, offset]
    );

    const users: GetUserByUsernameResult[] = rows.map((row) => {
      const { id, username } = row;
      const newRow = { id, username };
      return newRow;
    });
    return users;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Problem getting users by username Search: \n" + message);
    throw new Error("Problem getting users by username Search: \n" + message);
  }
}

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

export async function getUserByUserID(
  userID: number
): Promise<userWithoutPassword> {
  try {
    const { rows }: QueryResult<UserRow> = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [userID]
    );
    const userData: UserRow = rows[0];
    const { password, ...userWithoutPassword } = userData;
    return userWithoutPassword;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error getting user by user ID: \n" + message);
    throw new Error("Error getting user by user ID: \n" + message);
  }
}

export async function getUserBySession(token: string) {
  try {
    const { rows }: QueryResult<UserNameRow> = await pool.query(
      `
      SELECT 
        users.username 
      FROM 
        users 
      JOIN 
        sessions ON users.id=sessions.user_id 
      WHERE 
        session_id = $1
      `,
      [token]
    );
    return rows[0];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error getting the user ID by session: \n" + message);
  }
}

export async function checkEmailExists(
  email: string
): Promise<UserRow | null> {
  try {
    const { rows }: QueryResult<UserRow> = await pool.query(
      "SELECT * FROM users WHERE LOWER(email)=LOWER($1)",
      [email.trim().toLowerCase()]
    );
    if (rows[0]) {
      return rows[0];
    } else {
      return null;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("Error checking if email already exists: \n" + message);
    throw new Error("Error checking if email already exists: \n" + message);
  }
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    const { rows }: QueryResult<UserRow> = await pool.query(
      "SELECT * FROM users WHERE username ILIKE $1",
      [username.trim()]
    );
    if (rows[0]) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("Error while checking if username exists in db: \n" + message);
    throw new Error("Error checking username exists: \n" + message);
  }
}

export async function checkSession(
  token: string,
  userID: number
): Promise<boolean> {
  try {
    if (!userID || !token) {
      console.log("checkSession: No User Information to Validate");
      return false;
    }
    const { rows }: QueryResult<SessionsRow> = await pool.query(
      "SELECT * FROM sessions WHERE session_id = $1 AND user_id = $2",
      [JSON.parse(token).sessionID, userID]
    );
    if (rows[0]) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error("Error cross referencing tokens and userID: \n" + message);
  }
}

export async function getSessionBySessionID(
  sessionID: string
): Promise<number | null> {
  try {
    if (sessionID !== undefined) {
      const { rows }: QueryResult<SessionsRow> = await pool.query(
        "SELECT * FROM sessions WHERE session_id = $1",
        [sessionID]
      );

      if (rows.length > 0) {
        const userID = rows[0].user_id;
        return userID;
      } else {
        throw new Error("No session found with that ID");
      }
    } else {
      throw new Error("Session ID is undefined");
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error getting session by Session ID: \n" + message);
    throw new Error("Error getting session by session ID: \n" + message);
  }
}

export async function storeSession(
  userID: number,
  sessionID: string
): Promise<void> {
  try {
    await pool.query(
      `
      INSERT INTO 
        sessions (session_id, user_id, created_at, expires_at) 
      VALUES 
        ($1, $2, NOW(), NOW() + INTERVAL '1 day')
      `,
      [sessionID, userID]
    );
    return;
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error storing user in session: \n" + message);
    throw new Error("Error storing session: \n" + message);
  }
}

export async function deleteSession(sessionID: string): Promise<void> {
  try {
    await pool.query("DELETE FROM sessions WHERE session_id = ($1)", [
      sessionID,
    ]);
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error Deleting Session Data: \n" + message);
    throw new Error("Error deleting session with Session ID: \n" + message);
  }
}

export async function cleanupSchedule(): Promise<void> {
  try {
    await pool.query("DELETE FROM sessions WHERE expires_at<NOW();");
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error in scheduled database cleanup: \n" + message);
    throw new Error("Error in scheduled database cleanup: \n" + message);
  }
}

const MessageSchema = z.object({
  type: z.string(),
  message: z.string(),
  registration: z.boolean(),
  conversationName: z.string().nullable().optional(),
  conversationID: z.number(),
  user: z.string(),
  userID: z.number(),
  reciever: z.array(z.string()),
  time: z.string(),
});
type Message = z.infer<typeof MessageSchema>;

export async function addMessageToConversations(
  data: string
): Promise<QueryResult | void> {
  try {
    const unverifiedMessage: Message = await JSON.parse(data);
    const message = MessageSchema.parse(unverifiedMessage);
    if (message.conversationName) {
      const doesExist = await checkConversationByName(message.conversationName);
      if (doesExist) {
        await checkIfParticipant(message);
        const response = await addMessage(message);
        return response;
      } else {
        await createConversationByName(message);
      }
    } else if (message.conversationID) {
      await addMessage(message);
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error adding message to database: \n" + message);
    throw new Error("Error adding message to database: \n" + message);
  }
}

export async function checkConversationByName(
  conversationName: string
): Promise<boolean> {
  try {
    const conversation = await getConversationByName(conversationName);
    if (conversation) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.error(
      "Error checking if user is a part of the conversation: \n" + message
    );
    throw new Error(
      "Error checking if user is a part of the conversation: \n" + message
    );
  }
}

export async function createConversationByName(data: Message): Promise<void> {
  try {
    await pool.query("INSERT INTO conversations (name) VALUES ($1)", [
      data.conversationName,
    ]);
    const conversation: ConversationsRow = await getConversationByName(
      data.conversationName
    );
    await addParticipant(conversation.id, data.userID);
    await pool.query(
      "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)",
      [conversation.id, data.userID, data.message]
    );
  } catch (err) {
    const message = checkErrorType(err);
    console.error(
      "Error creating conversation in database with name: \n" + message
    );
    throw new Error(
      "Error creating conversation in database with name: \n" + message
    );
  }
}

export async function getConversationByName(
  name: string | null | undefined
): Promise<ConversationsRow> {
  try {
    const { rows }: QueryResult<ConversationsRow> = await pool.query(
      "SELECT * FROM conversations WHERE name = $1",
      [name]
    );
    return rows[0];
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error getting conversation by name: \n" + message);
    throw new Error("Error getting conversation by name: \n" + message);
  }
}

export async function checkIfParticipant(data: Message) {
  try {
    const conversation: ConversationsRow = await getConversationByName(
      data.conversationName
    );
    const participants: ConversationParticipantsRow[] =
      await getParticipantsByConversationID(conversation.id);

    const isParticipant = participants.some((participant) => {
      return participant.user_id === data.userID;
    });

    if (!isParticipant) {
      await addParticipant(conversation.id, data.userID);
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.error(
      "Error Checking if User is a participant of conversation: \n" + message
    );
    throw new Error(
      "Error checking if user is a participant of conversation: \n" + message
    );
  }
}

async function getParticipantsByConversationID(
  conversationID: number
): Promise<ConversationParticipantsRow[]> {
  try {
    const { rows }: QueryResult<ConversationParticipantsRow> = await pool.query(
      "SELECT * FROM conversation_participants WHERE conversation_id = $1",
      [conversationID]
    );
    return rows;
  } catch (err) {
    const message = checkErrorType(err);
    console.error(
      "Error finding conversation participants by conversation ID: " + message
    );
    throw new Error(
      "Error finding conversation participants by conversation ID " + message
    );
  }
}

async function addMessage(data: Message): Promise<QueryResult<never>> {
  try {
    const response: QueryResult<never> = await pool.query(
      "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)",
      [data.conversationID, data.userID, data.message]
    );
    return response;
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error adding message to the database: \n" + message);
    throw new Error("Error adding message to the database: \n" + message);
  }
}

export async function getChatMessagesByName(
  name: string,
  page: number,
  limit: number
): Promise<MessagesRow[]> {
  try {
    const conversation: ConversationsRow = await getConversationByName(name);
    const rows: MessagesRow[] = await getChatMessagesByConversationID(
      conversation.id,
      page,
      limit
    );
    return rows;
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error retrieving messages from database: \n " + message);
    throw new Error("Error getting chat messages by name: \n " + message);
  }
}

export async function getChatMessagesByConversationID(
  conversationID: number | string,
  page: number,
  limit: number
): Promise<MessagesRow[]> {
  try {
    if (!conversationID || conversationID === "undefined") {
      throw new Error(
        "getChatMessagesByConversationID: No user information to retrieve messages for"
      );
    }

    const offset = page * limit;

    const { rows }: QueryResult<MessagesRow> = await pool.query(
      `
      SELECT * 
      FROM 
        (
          SELECT * 
          FROM 
            messages 
          WHERE 
            conversation_id = $1
          ORDER BY 
            created_at 
          DESC LIMIT $2 OFFSET $3
        ) 
      AS 
        page 
      ORDER BY 
        created_at 
        ASC
      `,
      [conversationID, limit, offset]
    );
    return rows;
  } catch (err) {
    const message = checkErrorType(err);
    console.error(
      "Error retrieving the chat messages by conversationID: \n" + message
    );
    throw new Error(
      "Error retrieving chat messages by conversationID: \n" + message
    );
  }
}

type ConversationUserIDRow = { user_id: number };

export async function getUserIDByConversationID(
  conversationID: number,
  userID: number
): Promise<number | null> {
  try {
    const { rows }: QueryResult<ConversationUserIDRow> = await pool.query(
      "SELECT user_id FROM conversation_participants WHERE conversation_id=$1 AND user_id!=$2",
      [conversationID, userID]
    );

    if (rows[0]) {
      return rows[0].user_id;
    } else {
      return null;
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.log("Error getting user id by conversation id: \n" + message);
    throw new Error("Error getting user id by conversation id: \n" + message);
  }
}

type UserChatsRow = {
  conversation_id: number;
  is_group: boolean;
  name: string;
  latest_created_at: Date;
};

export async function getUserChats(
  userID: number,
  page: number,
  limit: number
): Promise<
  (UserChatsRow & {
    participants: string[];
    is_read: boolean;
    created_at?: number;
  })[]
> {
  try {
    const offset: number = page * limit;

    const { rows }: QueryResult<UserChatsRow> = await pool.query(
      `
        SELECT 
          cp.conversation_id, 
          c.is_group, 
          c.name,
          m.latest_created_at
        FROM conversation_participants cp
        JOIN conversations c 
        ON c.id = cp.conversation_id
        JOIN (
          SELECT conversation_id, MAX(created_at) AS latest_created_at
          FROM messages
          GROUP BY conversation_id
        ) m ON m.conversation_id = cp.conversation_id
        WHERE cp.user_id = $1
        ORDER BY m.latest_created_at DESC
        LIMIT $2
        OFFSET $3;
        `,
      [userID, limit, offset]
    );

    const chatList: (UserChatsRow & { participants: string[] })[] =
      await Promise.all(
        rows.map(async (row) => {
          const participants: ConversationParticipantsRow[] =
            await getParticipantsByConversationID(row.conversation_id);
          const names: string[] = await parseNamesByUserID(
            participants,
            userID
          );
          return { ...row, participants: names };
        })
      );

    const chatListIsRead: (UserChatsRow & {
      participants: string[];
      is_read: boolean;
    })[] = await Promise.all(
      chatList.map(async (chat) => {
        if (chat.name || chat.participants.length > 1) {
          return { ...chat, is_read: true };
        } else {
          const id = await getUserIDByUsername(chat.participants[0]);

          const { rows } = await pool.query(
            `
            SELECT 
              is_read 
            FROM 
              messages 
            WHERE 
              conversation_id = $1 
              AND 
              sender_id = $2 
            ORDER BY 
              id 
            DESC LIMIT 1
            `,

            [chat.conversation_id, id]
          );

          if (!rows[0]) {
            return { ...chat, is_read: true, created_at: 0 };
          } else {
            return {
              ...chat,
              is_read: rows[0].is_read,
            };
          }
        }
      })
    );
    if (page == 0) {
      for (let i = 0; i < chatListIsRead.length; i++) {
        if (chatListIsRead[i].name) {
          const chat = chatListIsRead[i];
          chatListIsRead.splice(i, 1);
          chatListIsRead.splice(0, 0, chat);
        }
      }
    }
    return chatListIsRead;
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error retrieving user chats: \n" + message);
    throw new Error("Error retrieving user chats: \n" + message);
  }
}

export async function setIsRead(conversationID: number, recieverID: number) {
  try {
    const isTrue: boolean = true;

    const response = await pool.query(
      `
      UPDATE 
        messages 
      SET 
        is_read=$1 
      WHERE id = ( 
            SELECT id 
            FROM messages 
            WHERE conversation_id=$2 AND sender_id = $3 
            ORDER BY id 
            DESC LIMIT 1)`,
      [isTrue, conversationID, recieverID]
    );
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "There was an error in updating is_read within the database: \n " +
        message
    );
    throw new Error(message);
  }
}

async function parseNamesByUserID(
  participants: ConversationParticipantsRow[],
  userID: number
): Promise<string[]> {
  try {
    const ids: (number | null)[] = participants.map((participant) => {
      const id = participant.user_id;
      return id;
    });
    const filtered: (number | null)[] = ids.filter((id) => {
      return Number(id) != Number(userID);
    });

    const names: Promise<string[]> = Promise.all(
      filtered.map(async (id) => {
        const { rows }: QueryResult<{ username: string }> = await pool.query(
          "SELECT users.username FROM users WHERE id=$1",
          [id]
        );
        return rows[0].username;
      })
    );
    return names;
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "Error in parsing usernames from websocket data -- parseNamesByUserID \n" +
        message
    );
    throw new Error(
      "Error in parsing usernames from websocket data -- parseNamesByUserID \n" +
        message
    );
  }
}

export async function checkDirectMessageConversationExists(
  userID: number,
  profileID: number
): Promise<number> {
  try {
    const { rows }: QueryResult<{ conversation_id: number; name: string }> =
      await pool.query(
        `
      SELECT DISTINCT 
        cp.conversation_id, 
        c.name
      FROM 
        conversation_participants cp
      JOIN 
        conversations c ON cp.conversation_id = c.id
      WHERE 
        cp.conversation_id IN (
          SELECT conversation_id 
          FROM conversation_participants 
          GROUP BY conversation_id 
          HAVING COUNT(*) = 2
        )
        AND cp.conversation_id IN (
          SELECT conversation_id 
          FROM conversation_participants 
          WHERE user_id IN ($1, $2) 
          GROUP BY conversation_id 
          HAVING COUNT(*) = 2
        )
        AND c.name IS NULL
      `,
        [userID, profileID]
      );
    if (rows[0]) {
      const conversation = JSON.stringify(rows[0]);
      console.log("Conversation exists: " + conversation);
      return rows[0].conversation_id;
    } else {
      console.log("Attempting to create Conversation: ");
      const { rows }: QueryResult<{ id: number }> = await pool.query(
        "INSERT INTO conversations DEFAULT VALUES RETURNING id"
      );
      console.log("new conversation: " + rows[0]);
      const conversation_id: number = rows[0].id;
      console.log("conversation id assigned: " + conversation_id);
      await addParticipant(conversation_id, userID);
      await addParticipant(conversation_id, profileID);

      return conversation_id;
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "Error in checking if a DM already exists -- checkDirectMessageConversationExists: \n" +
        message
    );
    throw new Error(
      "Error in checking if a DM already exists -- checkDirectMessageConversationExists: \n" +
        message
    );
  }
}

export async function addFriendRequestToDatabase(
  userID: number,
  profileID: number
) {
  try {
    await pool.query(
      "INSERT INTO friend_requests (user_id, request_id, status) VALUES ($1, $2, $3)",
      [userID, profileID, "pending"]
    );
  } catch (err) {
    const message = checkErrorType(err);
    return message;
  }
}

export async function getFriendRequests(
  userID: number
): Promise<{ id: number; username: string }[]> {
  try {
    const { rows }: QueryResult<FriendRequestsRow> = await pool.query(
      "SELECT * FROM friend_requests WHERE request_id=$1",
      [userID]
    );
    const users = await Promise.all(
      rows.map(async (friendRequest) => {
        const user: userWithoutPassword = await getUserByUserID(
          friendRequest.user_id
        );
        const {
          email,
          is_admin,
          created_at,
          about_me,
          is_public,
          profile_picture,
          ...strippedUser
        } = user;

        return strippedUser;
      })
    );
    return users;
  } catch (err) {
    const message = checkErrorType(err);
    throw new Error(
      "Error when getting friend requests from database \n" + message
    );
  }
}

export async function checkFriendRequestSent(
  userID: number,
  profileID: number
): Promise<Boolean> {
  try {
    const { rows }: QueryResult<FriendRequestsRow> = await pool.query(
      "SELECT * FROM friend_requests WHERE user_id=$1 AND request_id=$2",
      [userID, profileID]
    );
    if (rows[0]) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.log("Error in database checking friend request: \n" + message);
    throw new Error("Error in database checking friend request: \n" + message);
  }
}

export async function addFriend(
  res: Response,
  userID: number,
  requestID: number
) {
  let smaller: number | null = null;
  let larger: number | null = null;

  try {
    if (userID < requestID) {
      smaller = userID;
      larger = requestID;
    } else {
      smaller = requestID;
      larger = userID;
    }

    await pool.query(
      "INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)",
      [smaller, larger]
    );

    await pool.query(
      `
      DELETE FROM 
        friend_requests 
      WHERE 
        (user_id = $1 AND request_id = $2)
      OR 
        (user_id = $2 AND request_id=$1)`,
      [userID, requestID]
    );
  } catch (err: any) {
    if (err.code && err.code === "23505") {
      console.log(
        "Users are already Friends \n UserID1: " +
          userID +
          "\n UserID2: " +
          requestID
      );
      res.status(409).json({ message: "Users are already Friends" });
    }
    console.log("Error in database query for add friend \n" + err.message);
    throw new Error("Error while adding to database \n" + err.message);
  }
}

export async function denyFriend(userID: number, requestID: number) {
  try {
    const response: QueryResult = await pool.query(
      "DELETE FROM friend_requests WHERE user_ID=$1 AND request_id=$2",
      [userID, requestID]
    );
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "Error in database query while denying friend request: \n" + message
    );
    throw new Error(
      "There was an error while denying friend request: \n" + message
    );
  }
}

export async function removeFriend(userID: number, friendID: number) {
  try {
    let smaller: number | null = null;
    let larger: number | null = null;
    if (userID < friendID) {
      smaller = userID;
      larger = friendID;
    } else {
      smaller = friendID;
      larger = userID;
    }

    pool.query("DELETE FROM friends WHERE user_id=$1 AND friend_id=$2", [
      smaller,
      larger,
    ]);
  } catch (err) {
    const message = checkErrorType(err);
    throw new Error("Error while removing friend from database: \n" + message);
  }
}

export async function checkIfFriends(
  userID: number,
  friendID: number
): Promise<FriendsRow> {
  let smaller: number | null = null;
  let larger: number | null = null;

  try {
    if (userID < friendID) {
      smaller = userID;
      larger = friendID;
    } else {
      smaller = friendID;
      larger = userID;
    }

    const { rows }: QueryResult<FriendsRow> = await pool.query(
      "SELECT * FROM friends WHERE user_id=$1 AND friend_id=$2",
      [smaller, larger]
    );
    return rows[0];
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "There was an error in checking friend status in database: \n" + message
    );
    throw new Error(
      "There was an error in checking friend status in database \n" + message
    );
  }
}

export async function getFriends(userID: number): Promise<number[]> {
  try {
    const { rows }: QueryResult<UserIDRow> = await pool.query(
      `(
        SELECT 
          friend_id AS id 
        FROM 
          friends 
        WHERE 
          user_id=$1 
      )

      UNION 
      
      ( 
        SELECT 
          user_id AS id 
        FROM 
          friends 
        WHERE 
          friend_id=$1
      )`,
      [userID]
    );
    const friendsList: number[] = rows.map((row) => {
      return row.id;
    });

    return friendsList;
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "Error in retrieval of user friends during query: \n" + message
    );
    throw new Error(
      "Error in retrieval of user friends during query: \n" + message
    );
  }
}

export async function blockUser(userID: number, blockedID: number) {
  try {
    pool.query("INSERT INTO blocked (user_id, blocked_id) VALUES ($1, $2)", [
      userID,
      blockedID,
    ]);
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "Error within blockUser function in database query: \n" + message
    );
    throw new Error("Error while attempting to block user: \n" + message);
  }
}

export async function checkIfBlocked(
  userID: number,
  blockedID: number
): Promise<boolean> {
  try {
    const { rows }: QueryResult<BlockedRow> = await pool.query(
      "SELECT * FROM blocked WHERE user_id=$1 AND blocked_id=$2",
      [userID, blockedID]
    );
    if (rows[0]) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.log("Error in checking the database: \n" + message);
    throw new Error("Error checking database: \n" + message);
  }
}

export async function unblockUser(userID: number, unblockedID: number) {
  try {
    await pool.query("DELETE FROM blocked WHERE user_id=$1 AND blocked_id=$2", [
      userID,
      unblockedID,
    ]);
  } catch (err) {
    const message = checkErrorType(err);
    console.log("Error in unblocking user within query: \n" + message);
    throw new Error("Error in unblocking user: \n" + message);
  }
}

type CheckIfPublicRow = { is_public: boolean };

export async function checkIfPublic(userID: number): Promise<boolean> {
  try {
    const { rows }: QueryResult<CheckIfPublicRow> = await pool.query(
      "SELECT is_public FROM users WHERE id=$1",
      [userID]
    );
    const isPublic = rows[0].is_public;
    return isPublic;
  } catch (err) {
    const message = checkErrorType(err);
    throw new Error(
      "There was a problem in checking database for profile status: \n" +
        message
    );
  }
}

export async function changeProfileStatus(
  userID: number,
  status: boolean
): Promise<QueryResult<UserRow>> {
  try {
    if (status) {
      const response: QueryResult<UserRow> = await pool.query(
        "UPDATE users SET is_public = FALSE WHERE id=$1 RETURNING *",
        [userID]
      );
      return response;
    } else {
      const response: QueryResult<UserRow> = await pool.query(
        "UPDATE users SET is_public = TRUE WHERE id=$1 RETURNING *",
        [userID]
      );
      return response;
    }
  } catch (err) {
    const message = checkErrorType(err);
    throw new Error(
      "There was a problem changing profile status within database: \n" +
        message
    );
  }
}

type ProfilePictureConfirmation = { message: string; url: string | null };

export async function addProfilePictureURL(
  key: string,
  userID: number
): Promise<ProfilePictureConfirmation> {
  try {
    const { rows }: QueryResult<UserRow> = await pool.query(
      "UPDATE users SET profile_picture=$1 WHERE id=$2 RETURNING *",
      [key, userID]
    );
    return {
      message: "Profile Picture Successfully uploaded",
      url: rows[0].profile_picture,
    };
  } catch (err) {
    const message = checkErrorType(err);
    console.log("Error within Database adding profile picture: \n" + message);
    throw new Error("Error adding to database profile picture: \n" + message);
  }
}

type GetProfilePictureURL = Pick<UserRow, "profile_picture">;

export async function getProfilePictureURL(
  userID: number
): Promise<GetProfilePictureURL | null> {
  try {
    const { rows }: QueryResult<GetProfilePictureURL> = await pool.query(
      "SELECT profile_picture FROM users WHERE id = $1",
      [userID]
    );
    if (rows[0]) {
      return rows[0];
    } else {
      return null;
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "There was an error in retrieving the profile picture url from the database: \n" +
        message
    );
    throw new Error(
      "There was an error in retrieving the profile picture url from the database: \n" +
        message
    );
  }
}

export async function getProfilePictureURLByUserName(
  userName: string
): Promise<string | null> {
  try {
    const { rows }: QueryResult<GetProfilePictureURL> = await pool.query(
      "SELECT profile_picture FROM users WHERE username=$1",
      [userName]
    );
    return rows[0].profile_picture;
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "There was an error in retrieving the profile picture by user name: \n" +
        message
    );
    throw new Error(
      "There was an error in retrieving the profile picture by user name: \n" +
        message
    );
  }
}

export async function editAboutMe(
  aboutMe: string,
  userID: number
): Promise<UserRow> {
  try {
    const { rows }: QueryResult<UserRow> = await pool.query(
      "UPDATE users SET about_me=$1 WHERE id=$2 RETURNING *",
      [aboutMe, userID]
    );
    return rows[0];
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "There was an error updating user about me in database: \n" + message
    );
    throw new Error(
      "\n There was an error updating user about me in database: \n" + message
    );
  }
}

type MutualFriends = Pick<UserRow, "id" | "username" | "profile_picture">;

export async function getMutualFriends(
  userID: number,
  profileID: number
): Promise<MutualFriends[]> {
  try {
    const { rows }: QueryResult<MutualFriends> = await pool.query(
      `
      WITH user1_friends AS (
        SELECT friend_id AS friend
        FROM friends
        WHERE user_id = $1
        UNION
        SELECT user_id AS friend
        FROM friends
        WHERE friend_id = $1
      ),
      user2_friends AS (
        SELECT friend_id AS friend
        FROM friends
        WHERE user_id = $2
        UNION
        SELECT user_id AS friend
        FROM friends
        WHERE friend_id = $2
      )
      SELECT u.id, u.username, u.profile_picture
      FROM users u
      JOIN (
        SELECT friend FROM user1_friends
        INTERSECT
        SELECT friend FROM user2_friends
      ) mutual ON mutual.friend = u.id
      `,
      [userID, profileID]
    );

    return rows;
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "There was an error in retrieving mutual friends: \n" + message
    );
    throw new Error(
      "There was an error in retrieving mutual friends: \n" + message
    );
  }
}


type CheckAdminStatus = Pick<UserRow, "is_admin">

export async function checkAdminStatus(id: number): Promise<boolean> {
  try {
    const { rows }:QueryResult<CheckAdminStatus> = await pool.query(
      'SELECT is_admin FROM users WHERE id=$1',
      [id],
    )
    if (rows[0].is_admin) {
      return true
    } else {
      return false
    }
  } catch (err) {
    const message = checkErrorType(err)
    throw new Error(message)
  }
}

export async function deleteMessage(messageID: number):Promise<boolean> {
  try {
    const result: QueryResult<MessagesRow> = await pool.query(
      'DELETE from MESSAGES where id=$1 RETURNING *',
      [messageID],
    )
    if (result.rowCount! > 0) {
      console.log('Deleted: ' + result.rows[0])
      return true
    } else {
      console.log('No Messages match that ID for deletion')
      return false
    }
  } catch (err) {
    const message = checkErrorType(err)
    throw new Error(message)
  }
}
