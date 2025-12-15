import {Router} from "express"
import * as adminController from "../controllers/adminController"
const adminRouter = Router()

adminRouter.delete("/message", adminController.deleteMessage)

export default adminRouter

