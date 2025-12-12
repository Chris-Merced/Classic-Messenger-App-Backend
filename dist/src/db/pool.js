"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const config_1 = __importDefault(require("../config"));
let pool;
try {
    pool = new pg_1.Pool(config_1.default);
}
catch (err) {
    console.error("Error creating pool:", err);
    throw err;
}
exports.default = pool;
//# sourceMappingURL=pool.js.map