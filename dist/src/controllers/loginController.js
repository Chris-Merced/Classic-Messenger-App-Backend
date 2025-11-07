"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = loginHandler;
exports.verifyPassword = verifyPassword;
const argon2 = __importStar(require("argon2"));
const crypto = __importStar(require("crypto"));
const db = __importStar(require("../db/queries"));
const zod_1 = require("zod");
const authentication_1 = require("../authentication");
//TODO:
// Verify that the login functionality is still working correctly
// Move on to logoutController.js and migrate
const LoginHandlerSchema = zod_1.z.object({
    username: zod_1.z.string(),
    password: zod_1.z.string(),
});
async function loginHandler(req, res) {
    try {
        console.log("made it handler");
        console.log(req.body.username);
        console.log(req.body.password);
        const parsed = LoginHandlerSchema.safeParse(req.body);
        if (!parsed.success) {
            console.log("Error with form data");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({ error: zod_1.z.treeifyError(parsed.error) });
        }
        const { username, password } = parsed.data;
        const user = await db.getUserByUsername(username);
        console.log("made it past db");
        if (user) {
            const passConfirm = await verifyPassword(user.password, password);
            if (passConfirm) {
                const sessionID = crypto.randomUUID();
                await db.storeSession(user.id, sessionID);
                const sessionToken = {
                    sessionID: sessionID,
                };
                res.cookie("sessionToken", JSON.stringify(sessionToken), {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    maxAge: 86400 * 1000,
                });
                res.status(201).json({
                    username: user.username,
                    id: user.id,
                    verified: true,
                });
                console.log("cookie sent");
            }
            else {
                res.status(401).json({
                    error: "Incorrect Password",
                });
            }
        }
        else {
            console.log("No user matching credentials");
            res.status(404).json({
                error: "Sorry there is no user that matches those credentials",
            });
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.error("Error in Handling Login: " + message);
        res.status(401).json({ error: "Error: " + message });
    }
}
async function verifyPassword(hashedPassword, inputPassword) {
    try {
        const isMatch = await argon2.verify(hashedPassword, inputPassword);
        return isMatch;
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.error("Error in password verification: " + message);
        throw new Error("Error in password verification: " + message);
    }
}
module.exports = { loginHandler };
//# sourceMappingURL=loginController.js.map