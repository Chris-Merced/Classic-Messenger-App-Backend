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
exports.compareSessionToken = compareSessionToken;
exports.checkAdminStatus = checkAdminStatus;
exports.checkErrorType = checkErrorType;
const db = __importStar(require("../src/db/queries"));
async function compareSessionToken(token, userID) {
    try {
        const isValid = await db.checkSession(token, userID);
        if (isValid) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (err) {
        const message = checkErrorType(err);
        console.error("Error authenticating user: " + message);
        return false;
    }
}
async function checkAdminStatus(id) {
    try {
        const adminStatus = await db.checkAdminStatus(id);
        console.log(adminStatus);
        if (adminStatus) {
            console.log("admin true");
            return true;
        }
        else {
            console.log("admin false");
            return false;
        }
    }
    catch (err) {
        const message = checkErrorType(err);
        console.log("Error verifying admin status" + message);
        return false;
    }
}
function checkErrorType(err) {
    return err instanceof Error ? err.message : String(err);
}
//# sourceMappingURL=authentication.js.map