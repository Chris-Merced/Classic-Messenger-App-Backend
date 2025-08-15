import pool from "./pool";
import { UserRow } from "../types/db";
import argon2 from "argon2";
import { z } from "zod";

import type { QueryResult } from "pg";


// TODO: SCROLL DOWN FOR CONTINUING TYPE MIGRATION
const UserInputSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
});
export type userInput = z.infer<typeof UserInputSchema>;

type UserNameRow = { username: string };
type UserEmailRow = { email: string };
type UserIDRow = { id: number };

async function addUser(user: userInput) {
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
    const id = await getUserIDByUsername(user.username.trim());

    if (id === -1) {
      throw new Error("Error retrieving new UserID By Username");
    }

    await addParticipant(1, id);
    return;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("Error attempting to add user: \n" + message);
    throw new Error(message);
  }
}

// START HERE BY VERIFYING DATABASE QUERIES AND MOVE DOWN

async function getUserIDByUsername(username: string): Promise<number> {
  try {
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE LOWER(username)=LOWER($1)",
      [username.toLowerCase()]
    );
    if (rows[0]) {
      return rows[0].id;
    } else {
      console.log("Within getUserIDByUsername: \n Username does not exist");
      return -1;
    }
  } catch (err) {
    const message = err instanceof Error ?  err.message : String(err)
    console.log(
      "There was an error in retrieving User ID By Username: \n" + message
    );
    return -1;
  }
}

async function addParticipant(conversation_id: number, user_id: number) {
  try {
    await pool.query(
      "INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)",
      [conversation_id, user_id]
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("Error adding participant to conversation: \n" + message);
    throw new Error(
      "Error adding participant to conversation: \n" + message
    );
  }
}
