"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const signupRouter = (0, express_1.Router)();
const signupController_1 = __importDefault(require("../controllers/signupController"));
signupRouter.post('/', signupController_1.default.signupHandler);
exports.default = signupRouter;
//# sourceMappingURL=signuprouter.js.map