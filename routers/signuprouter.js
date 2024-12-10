const { Router } = require("express");
const signupRouter = Router();
const signupController = require("../controllers/signupController");

signupRouter.post("/", signupController.signupHandler);

module.exports = signupRouter;
