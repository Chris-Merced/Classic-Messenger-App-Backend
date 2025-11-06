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
const db = __importStar(require("../db/queries"));
const authentication = __importStar(require("../authentication"));
const authentication_1 = require("../authentication");
//REROUTE ALL DB IMPORTS AT THE TOP TO NEW QUERIES.TS, ENSURE EVERYTHING IS FUNCTIONAL
// FILES AFFECTED: INDEX.JS, AUTHENTICATION.JS, ALL CONTROLLERS
// TESTS WILL ALSO BE AFFECTED
//AFTER THAT
//START HERE FOR CONTINUED MIGRATION --  CONTINUE DOWNWARDS CREATING NEW
//  AND SEPERATE FILES FOR TYPESCRIPT FOR CLEAN MERGING IN THE FUTURE
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
module.exports = { deleteMessage };
//# sourceMappingURL=adminController.js.map