"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUser = addUser;
exports.getUserIDByUsername = getUserIDByUsername;
exports.addParticipant = addParticipant;
const pool_1 = __importDefault(require("./pool"));
const zod_1 = require("zod");
// TODO: SCROLL DOWN FOR CONTINUING TYPE MIGRATION
const UserInputSchema = zod_1.z.object({
    username: zod_1.z.string(),
    email: zod_1.z.string(),
    password: zod_1.z.string(),
});
async function addUser(user) {
    console.log("NEW TYPED ROUTE");
    try {
        const userData = UserInputSchema.parse(user);
        let userNameData = await pool_1.default.query("SELECT * FROM users WHERE username ILIKE $1", [userData.username.trim()]);
        if (userNameData.rows[0] &&
            userNameData.rows[0].username.toLowerCase() ===
                user.username.trim().toLowerCase()) {
            console.log("User Already Exists");
            throw new Error("User Already Exists");
        }
        let emailData = await pool_1.default.query("SELECT * FROM users WHERE LOWER(email)=LOWER($1)", [user.email.trim()]);
        if (emailData.rows[0]) {
            console.log("Email already in use");
            throw new Error("Email Already In Use");
        }
        await pool_1.default.query("INSERT INTO users (username,password, email) VALUES ($1, $2, $3)", [user.username.trim(), user.password, user.email.trim().toLowerCase()]);
        const id = await getUserIDByUsername(user.username.trim());
        if (id) {
            await addParticipant(1, id);
        }
        return;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log("Error attempting to add user: \n" + message);
        throw new Error(message);
    }
}
async function getUserIDByUsername(username) {
    try {
        const { rows } = await pool_1.default.query("SELECT id FROM users WHERE LOWER(username)=LOWER($1)", [username.toLowerCase()]);
        if (rows[0]) {
            return rows[0].id;
        }
        else {
            console.log("Within getUserIDByUsername: \n Username does not exist");
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log("There was an error in retrieving User ID By Username: \n" + message);
    }
}
async function addParticipant(conversation_id, user_id) {
    try {
        await pool_1.default.query("INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)", [conversation_id, user_id]);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Error adding participant to conversation: \n" + message);
        throw new Error("Error adding participant to conversation: \n" + message);
    }
}
//# sourceMappingURL=queriesTyped.js.map