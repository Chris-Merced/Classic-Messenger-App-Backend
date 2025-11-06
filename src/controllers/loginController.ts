import * as argon2 from "argon2";
import * as crypto from "crypto";
import * as db from "../db/queries";
import { z } from "zod";
import type { Response, Request } from "express";
import { checkErrorType } from "../authentication";

//TODO:
// Verify that the login functionality is still working correctly
// Move on to logoutController.js and migrate

const LoginHandlerSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function loginHandler(req: Request, res: Response) {
  try {
    console.log("made it handler");
    console.log(req.body.username);
    console.log(req.body.password);

    const parsed = LoginHandlerSchema.safeParse(req.body);

    if (!parsed.success) {
      console.log("Error with form data");
      console.log(z.treeifyError(parsed.error));
      return res.status(400).json({ error: z.treeifyError(parsed.error) });
    }

    const { username, password } = parsed.data;

    const user = await db.getUserByUsername(username);
    console.log("made it past db");
    if (user) {
      const passConfirm = await verifyPassword(user.password, password);

      if (passConfirm) {
        const sessionID = crypto.randomUUID();
        await db.storeSession(user.id, sessionID);

        const sessionToken = {
          sessionID: sessionID,
        };

        res.cookie("sessionToken", JSON.stringify(sessionToken), {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 86400 * 1000,
        });

        res.status(201).json({
          username: user.username,
          id: user.id,
          verified: true,
        });

        console.log("cookie sent");
      } else {
        res.status(401).json({
          error: "Incorrect Password",
        });
      }
    } else {
      console.log("No user matching credentials");
      res.status(404).json({
        error: "Sorry there is no user that matches those credentials",
      });
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error in Handling Login: " + message);
    res.status(401).json({ error: "Error: " + message });
  }
}

export async function verifyPassword(
  hashedPassword: string,
  inputPassword: string
): Promise<boolean> {
  try {
    const isMatch = await argon2.verify(hashedPassword, inputPassword);
    return isMatch;
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error in password verification: " + message);
    throw new Error("Error in password verification: " + message);
  }
}

module.exports = { loginHandler };
