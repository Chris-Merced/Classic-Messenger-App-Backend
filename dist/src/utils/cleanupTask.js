"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionCleanup = sessionCleanup;
const node_cron_1 = __importDefault(require("node-cron"));
const queries_1 = require("../db/queries");
let cleanupTask = null;
//Database Query to clean up expired sessions
function sessionCleanup() {
    if (!cleanupTask) {
        cleanupTask = node_cron_1.default.schedule("* * * * *", queries_1.cleanupSchedule);
    }
}
//# sourceMappingURL=cleanupTask.js.map