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
exports.signupHandler = signupHandler;
exports.hashPassword = hashPassword;
const argon2 = __importStar(require("argon2"));
const db = __importStar(require("../db/queries"));
const zod_1 = require("zod");
const authentication_1 = require("../authentication");
const SignupHandlerSchema = zod_1.z.object({
    username: zod_1.z.string().max(16),
    password: zod_1.z.string(),
    email: zod_1.z.email()
});
async function signupHandler(req, res) {
    try {
        const parsed = SignupHandlerSchema.safeParse(req.body);
        if (!parsed.success) {
            console.log("Issue parsing signup object");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(500).json({ error: zod_1.z.treeifyError(parsed.error) });
        }
        const { username, password, email } = parsed.data;
        const hashedPassword = await hashPassword(password);
        const user = { username, email, password: hashedPassword };
        await db.addUser(user);
        res.status(201).json({ message: "User Created Successfully" });
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        res.status(409).json({ error: message });
    }
}
async function hashPassword(password) {
    try {
        const hash = await argon2.hash(password);
        return hash;
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.error("Error hashing password: " + message);
        throw new Error("Error hashing password: " + message);
    }
}
module.exports = { signupHandler };
//# sourceMappingURL=signupController.js.map