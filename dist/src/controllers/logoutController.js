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
exports.logoutUser = logoutUser;
const db = __importStar(require("../db/queries"));
const zod_1 = require("zod");
const authentication_1 = require("../authentication");
const SessionCookieSchema = zod_1.z.object({
    sessionID: zod_1.z.string(),
});
async function logoutUser(req, res) {
    try {
        const cookie = JSON.parse(req.cookies.sessionToken);
        const parsed = SessionCookieSchema.safeParse(cookie);
        if (!parsed.success) {
            console.log("Error while logging out user: ");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({ error: zod_1.z.treeifyError(parsed.error) });
        }
        const { sessionID } = parsed.data;
        await db.deleteSession(sessionID);
        res.status(200).json({ message: "Logout Successful" });
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.error("Error in logging out user: " + message);
        res.status(500).json({ message: "Error in logging out user: " + message });
    }
}
exports.default = { logoutUser };
//# sourceMappingURL=logoutController.js.map