import {Router} from "express"
import * as adminController from "../controllers/adminController"
const adminRouter = Router()

adminRouter.delete("/message", adminController.deleteMessage)
adminRouter.post("/ban", adminController.banUser)
adminRouter.patch("/unban", adminController.unbanUser)
adminRouter.patch("/adminStatus", adminController.makeAdmin)

export default adminRouter

