const loginController = require('../controllers/loginController');
const { Router } = require('express`');
const loginRouter = Router();


loginRouter.use('/log-in', loginController.loginHandler);

module.exports = loginRouter;