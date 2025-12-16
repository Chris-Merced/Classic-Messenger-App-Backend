"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loginController_1 = __importDefault(require("../controllers/loginController"));
const express_1 = require("express");
const loginRouter = (0, express_1.Router)();
loginRouter.post('/', loginController_1.default.loginHandler);
exports.default = loginRouter;
//# sourceMappingURL=loginRouter.js.map