const {Router} = require("express")
const adminController = require("../controllers/adminController")
const adminRouter = Router()

adminRouter.delete("/message", adminController.deleteMessage)

module.exports = adminRouter

