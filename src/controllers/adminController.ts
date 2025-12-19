import * as db from "../db/queries";
import * as authentication from "../authentication";
import type { Request, Response } from "express";
import {z} from "zod"
import { checkErrorType } from "../authentication";
import { getUserIDByUsername } from "./userProfileController";

export async function deleteMessage(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticated: boolean = await authentication.compareSessionToken(
      req.cookies.sessionToken,
      req.body.id
    );
    const isAdmin: boolean = await authentication.checkAdminStatus(req.body.id);
    if (authenticated && isAdmin) {
      const success: boolean = await db.deleteMessage(req.body.messageID);
      if (success) {
        res.status(200).json("Message Deleted Successfully");
      } else {
        res.status(404).json("Message not found for deletion");
      }
    } else {
      res.status(403).json("Unauthorized Action");
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.log("Error deleting message from database" + message);
    res.status(500).json("Internal Server Error");
  }
}

const BanUserSchema = z.object({
  username: z.string(),
  days: z.string().or(z.number().int().positive())
})

export async function banUser(req: Request, res: Response) {
  try {
    const admin = await db.getUserBySession(req.cookies.sessionToken);
    if (!admin) {
      console.log("There is no user to authenticate admin status");
      return res.status(400).json({ error: "No user to authenticate admin status" });
    }
    const adminID = await db.getUserIDByUsername(admin.username);
    if (!adminID) {
      console.log("oopsie poopie");
      return res
        .status(404)
        .json({ error: "Unable to find id for provided user" });
    }
    const authenticated = authentication.checkAdminStatus(adminID);
    if (!authenticated) {
      console.log("User is not allowed to ban other users");
      return res
        .status(403)
        .json({ error: "You are not permitted to perform that operation" });
    }
    
    const parsed = BanUserSchema.safeParse(req.query)
    if(!parsed.success){
      console.log("Data provided is invalid: " + z.treeifyError(parsed.error))
      return res.status(403).json({error: "Data provided is invalid: " + z.treeifyError(parsed.error)})
    }
    let {days, username} = parsed.data
    //keep original logic until runtime is proven to work
    //let days = req.query.days;
    //const username = req.query.username;

    const user = await db.getUserByUsername(username);
    let banExpiresAt : Date | string = "";
    if (user) {
      if (days === "perm") {
        banExpiresAt = "perm";
      } else {
        if(typeof days === "string"){
          days = parseInt(days);
        }
        banExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
      const result = await db.banUser(banExpiresAt, user.id);
      if (result) {
        res.status(200).json({ message: "Good ban" });
      } else {
        res.status(500).json({ error: "Server error while banning user" });
      }
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    const message =  checkErrorType(err)
    console.log("Error banning user " + message);
    res.status(500).json({ error: "Server error while banning user: " + message });
  }
}

//START HERE
//BAN QUERIES EXIST IN QUERIES.OLD
async function unbanUser(req, res) {
  try {
    const username = req.body.username;
    const user = await db.getUserByUsername(username);
    if (user) {
      const response = await db.unbanUser(user.id);
      if (response) {
        res.status(200).json({ message: "User unbanned" });
      } else {
        res.status(500).json({ message: "User could not be unbanned" });
      }
    } else {
      console.log("Could not find user of username");
      res.status(404).json({ error: "User Does Not Exist" });
    }
  } catch (err) {
    console.log("Error while banning user" + err.message);
    res.status(500).json({ error: "Server error while banning user" });
  }
}

async function makeAdmin(req, res) {
  try {
    console.log("made it");
    const username = req.body.username;
    const user = await db.getUserByUsername(username);

    if (user) {
      const response = await db.makeAdmin(user.id);
      if (response) {
        res.status(200).json({ message: "Successfully Created Admin" });
      } else {
        throw new Error("No User Updated");
      }
    } else {
      res.status(404).json({ error: "Could not find user to update" });
    }
  } catch (err) {
    console.log("Error updating admin status: " + err.message);
    res.status(500).json({ error: "Error updating admin status" });
  }
}

module.exports = { deleteMessage, banUser, unbanUser, makeAdmin };
