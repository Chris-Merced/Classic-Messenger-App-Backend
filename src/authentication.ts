import * as db from "../src/db/queries"

export async function compareSessionToken(token: string, userID: number) {
  try {
    const isValid: boolean = await db.checkSession(token, userID);
    if (isValid) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    const message = checkErrorType(err)
    console.error("Error authenticating user: " + message);
    return false;
  }
}

export async function checkAdminStatus(id : number) {
  try {
    const adminStatus = await db.checkAdminStatus(id);
    console.log(adminStatus);
    if (adminStatus) {
      console.log("admin true");
      return true;
    } else {
      console.log("admin false");
      return false;
    }
  } catch (err) {
    const message = checkErrorType(err)
    console.log("Error verifying admin status" + message);
    return false;
  }
}

export function checkErrorType(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default {compareSessionToken, checkAdminStatus}

