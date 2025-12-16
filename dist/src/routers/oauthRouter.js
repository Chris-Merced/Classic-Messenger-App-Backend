"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const oauthController_1 = __importDefault(require("../controllers/oauthController"));
const oauthRouter = (0, express_1.Router)();
oauthRouter.patch('/', oauthController_1.default.oauthLogin);
oauthRouter.post('/signup', oauthController_1.default.oauthSignup);
exports.default = oauthRouter;
//# sourceMappingURL=oauthRouter.js.map