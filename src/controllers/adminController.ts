import * as db from "../db/queries"
import * as authentication from "../authentication"
import type { Request, Response } from "express";
import { checkErrorType } from "../authentication";

//REROUTE ALL DB IMPORTS AT THE TOP TO NEW QUERIES.TS, ENSURE EVERYTHING IS FUNCTIONAL
// FILES AFFECTED: INDEX.JS, AUTHENTICATION.JS, ALL CONTROLLERS
// TESTS WILL ALSO BE AFFECTED
//AFTER THAT
//START HERE FOR CONTINUED MIGRATION --  CONTINUE DOWNWARDS CREATING NEW
//  AND SEPERATE FILES FOR TYPESCRIPT FOR CLEAN MERGING IN THE FUTURE

async function deleteMessage(req: Request, res:Response) {
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
    const message = checkErrorType(err)
    console.log("Error deleting message from database" + message);
    res.status(500).json("Internal Server Error");
  }
}

module.exports = { deleteMessage };
