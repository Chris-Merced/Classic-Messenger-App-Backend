import * as db from "../db/queries";
import type { Response, Request } from "express";
import { z } from "zod";
import { checkErrorType } from "../authentication";

const SessionCookieSchema = z.object({
  sessionID: z.string(),
});

export async function logoutUser(req: Request, res: Response) {
  try {
    const cookie = JSON.parse(req.cookies.sessionToken);
    const parsed = SessionCookieSchema.safeParse(cookie);
    if (!parsed.success) {
      console.log("Error while logging out user: ");
      console.log(z.treeifyError(parsed.error));
      return res.status(400).json({ error: z.treeifyError(parsed.error) });
    }
    const { sessionID } = parsed.data;
    await db.deleteSession(sessionID);
    res.status(200).json({ message: "Logout Successful" });
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error in logging out user: " + message);
    res.status(500).json({ message: "Error in logging out user: " + message });
  }
}

export default { logoutUser };
