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
exports.deleteMessage = deleteMessage;
exports.banUser = banUser;
exports.unbanUser = unbanUser;
exports.makeAdmin = makeAdmin;
const db = __importStar(require("../db/queries"));
const authentication = __importStar(require("../authentication"));
const zod_1 = require("zod");
const authentication_1 = require("../authentication");
async function deleteMessage(req, res) {
    try {
        const authenticated = await authentication.compareSessionToken(req.cookies.sessionToken, req.body.id);
        const isAdmin = await authentication.checkAdminStatus(req.body.id);
        if (authenticated && isAdmin) {
            const success = await db.deleteMessage(req.body.messageID);
            if (success) {
                res.status(200).json("Message Deleted Successfully");
            }
            else {
                res.status(404).json("Message not found for deletion");
            }
        }
        else {
            res.status(403).json("Unauthorized Action");
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("Error deleting message from database" + message);
        res.status(500).json("Internal Server Error");
    }
}
const BanUserSchema = zod_1.z.object({
    username: zod_1.z.string(),
    days: zod_1.z.string().or(zod_1.z.number().int().positive()),
});
async function banUser(req, res) {
    try {
        const admin = await db.getUserBySession(req.cookies.sessionToken);
        if (!admin) {
            console.log("There is no user to authenticate admin status");
            return res
                .status(400)
                .json({ error: "No user to authenticate admin status" });
        }
        const adminID = await db.getUserIDByUsername(admin.username);
        if (!adminID) {
            console.log("oopsie poopie");
            return res
                .status(404)
                .json({ error: "Unable to find id for provided user" });
        }
        const authenticated = authentication.checkAdminStatus(adminID);
        if (!authenticated) {
            console.log("User is not allowed to ban other users");
            return res
                .status(403)
                .json({ error: "You are not permitted to perform that operation" });
        }
        const parsed = BanUserSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Data provided is invalid: " + zod_1.z.treeifyError(parsed.error));
            return res.status(403).json({
                error: "Data provided is invalid: " + zod_1.z.treeifyError(parsed.error),
            });
        }
        let { days, username } = parsed.data;
        //keep original logic until runtime is proven to work
        //let days = req.query.days;
        //const username = req.query.username;
        const user = await db.getUserByUsername(username);
        let banExpiresAt = "";
        if (user) {
            if (days === "perm") {
                banExpiresAt = "perm";
            }
            else {
                if (typeof days === "string") {
                    days = parseInt(days);
                }
                banExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            }
            const result = await db.banUser(banExpiresAt, user.id);
            if (result) {
                res.status(200).json({ message: "Good ban" });
            }
            else {
                res.status(500).json({ error: "Server error while banning user" });
            }
        }
        else {
            res.status(404).json({ error: "User not found" });
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("Error banning user " + message);
        res
            .status(500)
            .json({ error: "Server error while banning user: " + message });
    }
}
//START HERE
//BAN QUERIES EXIST IN QUERIES.OLD
const UnbanUserSchema = zod_1.z.object({
    username: zod_1.z.string(),
});
async function unbanUser(req, res) {
    try {
        const admin = await db.getUserBySession(req.cookies.sessionToken);
        if (!admin) {
            console.log("There is no user to authenticate admin status");
            return res
                .status(400)
                .json({ error: "No user to authenticate admin status" });
        }
        const adminID = await db.getUserIDByUsername(admin.username);
        if (!adminID) {
            console.log("oopsie poopie");
            return res
                .status(404)
                .json({ error: "Unable to find id for provided user" });
        }
        const authenticated = authentication.checkAdminStatus(adminID);
        if (!authenticated) {
            console.log("User is not allowed to ban other users");
            return res
                .status(403)
                .json({ error: "You are not permitted to perform that operation" });
        }
        const parsed = UnbanUserSchema.safeParse(req.body);
        if (!parsed.success) {
            console.error("Invalid user input for unbanning user: " + zod_1.z.treeifyError(parsed.error));
            return res
                .status(400)
                .json({
                error: "Invalid user input for unbanning user: " +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { username } = parsed.data;
        const user = await db.getUserByUsername(username);
        if (user) {
            const response = await db.unbanUser(user.id);
            if (response) {
                res.status(200).json({ message: "User unbanned" });
            }
            else {
                res.status(500).json({ message: "User could not be unbanned" });
            }
        }
        else {
            console.log("Could not find user of username");
            res.status(404).json({ error: "User Does Not Exist" });
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("Error while banning user" + message);
        res.status(500).json({ error: "Server error while banning user" });
    }
}
const MakeAdminSchema = zod_1.z.object({
    username: zod_1.z.string(),
});
async function makeAdmin(req, res) {
    try {
        const admin = await db.getUserBySession(req.cookies.sessionToken);
        if (!admin) {
            console.log("There is no user to authenticate admin status");
            return res
                .status(400)
                .json({ error: "No user to authenticate admin status" });
        }
        const adminID = await db.getUserIDByUsername(admin.username);
        if (!adminID) {
            console.log("oopsie poopie");
            return res
                .status(404)
                .json({ error: "Unable to find id for provided user" });
        }
        const authenticated = authentication.checkAdminStatus(adminID);
        if (!authenticated) {
            console.log("User is not allowed to ban other users");
            return res
                .status(403)
                .json({ error: "You are not permitted to perform that operation" });
        }
        const parsed = MakeAdminSchema.safeParse(req.body);
        if (!parsed.success) {
            console.error("Invalid input while making admin: " + zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({ error: "Invalid username input for making a user admin: " + zod_1.z.treeifyError(parsed.error) });
        }
        const { username } = parsed.data;
        const user = await db.getUserByUsername(username);
        if (user) {
            const response = await db.makeAdmin(user.id);
            if (response) {
                res.status(200).json({ message: "Successfully Created Admin" });
            }
            else {
                throw new Error("No User Updated");
            }
        }
        else {
            res.status(404).json({ error: "Could not find user to update" });
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("Error updating admin status: " + message);
        res.status(500).json({ error: "Error updating admin status" });
    }
}
module.exports = { deleteMessage, banUser, unbanUser, makeAdmin };
//# sourceMappingURL=adminController.js.map