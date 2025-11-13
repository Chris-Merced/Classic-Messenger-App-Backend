import * as db from "../db/queries";
import * as crypto from "crypto";
import type { Response, Request } from "express";
import { env } from "../types/env";
import { checkErrorType } from "../authentication";
import { z } from "zod";

export async function oauthLogin(req: Request, res: Response) {
  const code: string = req.body.code;

  if (!code) {
    res.status(400).json({ error: "Missing Code" });
  }
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.OAUTH_CLIENTID,
        client_secret: env.OAUTH_SECRET,
        redirect_uri: env.FRONTEND_OAUTH_URL,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.err) {
      return res.status(400).json({ error: tokenData.error_description });
    }

    console.log("Made it through token retrieval");

    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const { email } = await userRes.json();

    const user = await db.checkEmailExists(email);

    if (!user) {
      console.log("Email does not exist in database");
      return res
        .status(404)
        .json({ error: "Email does not exist in database" });
    } else {
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
      });

      console.log("cookie sent");
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.log("Error during OAuth: \n" + message);
    res.status(500).json({ error: "Error during OAuth Login " + message });
  }
}

const OauthSignupSchema = z.object({
  email: z.string(),
  username: z.string(),
});

export async function oauthSignup(req: Request, res: Response) {
  try {
    const parsed = OauthSignupSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log("error in req object for oauthSignup");
      console.log(z.treeifyError(parsed.error));
      return res.status(500).json({ error: z.treeifyError(parsed.error) });
    }
    const { email, username } = parsed.data;
    const usernameExists = await db.checkUsernameExists(username);

    if (usernameExists) {
      res.status(409).json({ error: "Username already exists" });
    } else {
      const userID = await db.addUserOAuth(email, username);

      const sessionID = crypto.randomUUID();
      await db.storeSession(userID, sessionID);

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
        username: req.body.username,
        id: userID,
        message: "User Successfully Added",
      });
    }

    console.log("made it to oauthSignup");
  } catch (err) {
    const message = checkErrorType(err)
    console.log(
      "There was an error attempting to signup in the OAuth process: \n" + message
    );
    res.status(500).json({ error: "Error in OAuth signup process " + message});
  }
}

module.exports = { oauthLogin, oauthSignup };
