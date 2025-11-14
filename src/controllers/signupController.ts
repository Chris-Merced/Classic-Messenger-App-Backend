import * as  argon2 from "argon2"
import * as db from "../db/queries"
import type {Request, Response} from "express"
import {z} from "zod"
import { checkErrorType } from "../authentication"

const SignupHandlerSchema = z.object({
  username: z.string().max(16),
  password: z.string(),
  email: z.email()
})

export async function signupHandler(req: Request, res: Response) {
  try {

    const parsed = SignupHandlerSchema.safeParse(req.body)
    if(!parsed.success){
      console.log("Issue parsing signup object")
      console.log(z.treeifyError(parsed.error))
      return res.status(500).json({error: z.treeifyError(parsed.error)})
    }
    const {username, password, email} = parsed.data
    const hashedPassword = await hashPassword(password);
    const user = { username, email, password: hashedPassword };

    await db.addUser(user);
    res.status(201).json({ message: "User Created Successfully" });
  } catch (err) {
    const message = checkErrorType(err)
    res.status(409).json({ error: message });
  }
}

export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await argon2.hash(password);
    return hash;
  } catch (err) {
    const message = checkErrorType(err)
    console.error("Error hashing password: " + message);
    throw new Error("Error hashing password: " + message);
  }
}

module.exports = { signupHandler };
