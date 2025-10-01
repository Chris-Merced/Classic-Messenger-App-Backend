const {Router} = require("express")
const adminController = require("../controllers/adminController")
const adminRouter = Router()

adminRouter.delete("/message", adminController.deleteMessage)
adminRouter.post("/ban", adminController.banUser)
adminRouter.patch("/unban", adminController.unbanUser)
adminRouter.patch("/adminStatus", adminController.makeAdmin)

module.exports = adminRouter

