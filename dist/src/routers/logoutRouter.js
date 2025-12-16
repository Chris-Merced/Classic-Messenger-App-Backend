"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logoutRouter = (0, express_1.Router)();
const logoutController_1 = __importDefault(require("../controllers/logoutController"));
logoutRouter.delete('/', logoutController_1.default.logoutUser);
exports.default = logoutRouter;
//# sourceMappingURL=logoutRouter.js.map