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
exports.oauthLogin = oauthLogin;
exports.oauthSignup = oauthSignup;
const db = __importStar(require("../db/queries"));
const crypto = __importStar(require("crypto"));
const env_1 = require("../types/env");
const authentication_1 = require("../authentication");
const zod_1 = require("zod");
async function oauthLogin(req, res) {
    const code = req.body.code;
    if (!code) {
        res.status(400).json({ error: "Missing Code" });
    }
    try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: env_1.env.OAUTH_CLIENTID,
                client_secret: env_1.env.OAUTH_SECRET,
                redirect_uri: env_1.env.FRONTEND_OAUTH_URL,
                grant_type: "authorization_code",
            }),
        });
        const tokenData = await tokenRes.json();
        if (tokenData.err) {
            return res.status(400).json({ error: tokenData.error_description });
        }
        console.log("Made it through token retrieval");
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });
        const { email } = await userRes.json();
        const user = await db.checkEmailExists(email);
        if (!user) {
            console.log("Email does not exist in database");
            return res
                .status(404)
                .json({ error: "Email does not exist in database" });
        }
        else {
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
            });
            console.log("cookie sent");
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("Error during OAuth: \n" + message);
        res.status(500).json({ error: "Error during OAuth Login " + message });
    }
}
const OauthSignupSchema = zod_1.z.object({
    email: zod_1.z.string(),
    username: zod_1.z.string(),
});
async function oauthSignup(req, res) {
    try {
        const parsed = OauthSignupSchema.safeParse(req.body);
        if (!parsed.success) {
            console.log("error in req object for oauthSignup");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(500).json({ error: zod_1.z.treeifyError(parsed.error) });
        }
        const { email, username } = parsed.data;
        const usernameExists = await db.checkUsernameExists(username);
        if (usernameExists) {
            res.status(409).json({ error: "Username already exists" });
        }
        else {
            const userID = await db.addUserOAuth(email, username);
            const sessionID = crypto.randomUUID();
            await db.storeSession(userID, sessionID);
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
                username: req.body.username,
                id: userID,
                message: "User Successfully Added",
            });
        }
        console.log("made it to oauthSignup");
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error attempting to signup in the OAuth process: \n" + message);
        res.status(500).json({ error: "Error in OAuth signup process " + message });
    }
}
exports.default = { oauthLogin, oauthSignup };
//# sourceMappingURL=oauthController.js.map