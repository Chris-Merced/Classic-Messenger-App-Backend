"use strict";
const loginController = require('../controllers/loginController');
const { Router } = require('express');
const loginRouter = Router();
loginRouter.post('/', loginController.loginHandler);
module.exports = loginRouter;
//# sourceMappingURL=loginRouter.js.map