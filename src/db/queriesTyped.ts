import pool from "./pool";
import { UserRow } from "../types/db";
import argon2 from "argon2";
import { z } from "zod";

import type { Query, QueryResult } from "pg";

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
})
type userWithoutPassword = z.infer<typeof userWithoutPasswordSchema>

export async function getUserByUserID(userID: number): Promise<userWithoutPassword> {
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

export async function checkEmailExists(email: string): Promise<UserRow | Boolean >{
  try {
    const { rows }: QueryResult<UserRow> = await pool.query(
      "SELECT * FROM users WHERE LOWER(email)=LOWER($1)",
      [email.trim().toLowerCase()]
    );
    if (rows[0]) {
      return rows[0];
    } else {
      return false;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log("Error checking if email already exists: \n" + message);
    throw new Error("Error checking if email already exists: \n" + message);
  }
}
