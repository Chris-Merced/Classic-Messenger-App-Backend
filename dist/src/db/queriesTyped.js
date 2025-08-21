"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUser = addUser;
exports.getUserIDByUsername = getUserIDByUsername;
exports.addParticipant = addParticipant;
exports.addUserOAuth = addUserOAuth;
exports.getUserByUsername = getUserByUsername;
exports.getUsersByUsernameSearch = getUsersByUsernameSearch;
exports.getUserByUserID = getUserByUserID;
exports.getUserBySession = getUserBySession;
exports.checkEmailExists = checkEmailExists;
exports.checkUsernameExists = checkUsernameExists;
exports.checkSession = checkSession;
exports.getSessionBySessionID = getSessionBySessionID;
exports.storeSession = storeSession;
exports.deleteSession = deleteSession;
exports.cleanupSchedule = cleanupSchedule;
const pool_1 = __importDefault(require("./pool"));
const argon2_1 = __importDefault(require("argon2"));
const zod_1 = require("zod");
// TODO: Do each function one by one and we'll connect routes after all of
//       queries is done -
//       - Start after GetUsersByUsernameSearch
const UserInputSchema = zod_1.z.object({
    username: zod_1.z.string(),
    email: zod_1.z.string(),
    password: zod_1.z.string(),
});
function checkErrorType(err) {
    return err instanceof Error ? err.message : String(err);
}
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
async function addUserOAuth(email, username) {
    try {
        const tempPassword = crypto.randomUUID();
        const hashedPassword = await argon2_1.default.hash(tempPassword);
        await pool_1.default.query("INSERT INTO users (username,password, email) VALUES ($1, $2, $3)", [username.trim(), hashedPassword, email.trim().toLowerCase()]);
        const id = await getUserIDByUsername(username.trim());
        if (id) {
            await addParticipant(1, id);
        }
        else {
            throw new Error("Could not find user ID by Username");
        }
        return id;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log("Error adding user to database via OAuth method: \n" + message);
        throw new Error("Error adding user to database via OAuth method: \n" + message);
    }
}
async function getUserByUsername(username) {
    try {
        const { rows } = await pool_1.default.query("SELECT * FROM users WHERE LOWER(username)=LOWER($1) ", [username]);
        const user = rows[0];
        return user;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Error getting user by username: \n" + message);
        throw new Error("Error getting user by username: \n" + message);
    }
}
const GetUserByUsernameSchema = zod_1.z.object({
    id: zod_1.z.number(),
    username: zod_1.z.string(),
});
const searchInputSchema = zod_1.z.object({
    username: zod_1.z.string(),
    page: zod_1.z.number().nonnegative().int(),
    limit: zod_1.z.number().nonnegative().int(),
});
async function getUsersByUsernameSearch(username, page, limit) {
    try {
        const { username: q, page: p, limit: l, } = searchInputSchema.parse({ username, page, limit });
        const offset = p * l;
        const { rows } = await pool_1.default.query("SELECT * FROM USERS WHERE username ILIKE $1 LIMIT $2 OFFSET $3", [`%${q}%`, l, offset]);
        const users = rows.map((row) => {
            const { id, username } = row;
            const newRow = { id, username };
            return newRow;
        });
        return users;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Problem getting users by username Search: \n" + message);
        throw new Error("Problem getting users by username Search: \n" + message);
    }
}
const userWithoutPasswordSchema = zod_1.z.object({
    id: zod_1.z.number(),
    username: zod_1.z.string(),
    email: zod_1.z.string(),
    is_admin: zod_1.z.boolean().nullable(),
    created_at: zod_1.z.date().nullable(),
    is_public: zod_1.z.boolean().nullable(),
    profile_picture: zod_1.z.string().nullable(),
    about_me: zod_1.z.string().nullable(),
});
async function getUserByUserID(userID) {
    try {
        const { rows } = await pool_1.default.query("SELECT * FROM users WHERE id = $1", [userID]);
        const userData = rows[0];
        const { password, ...userWithoutPassword } = userData;
        return userWithoutPassword;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Error getting user by user ID: \n" + message);
        throw new Error("Error getting user by user ID: \n" + message);
    }
}
async function getUserBySession(token) {
    try {
        const { rows } = await pool_1.default.query(`
      SELECT 
        users.username 
      FROM 
        users 
      JOIN 
        sessions ON users.id=sessions.user_id 
      WHERE 
        session_id = $1
      `, [token]);
        return rows[0];
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Error getting the user ID by session: \n" + message);
    }
}
async function checkEmailExists(email) {
    try {
        const { rows } = await pool_1.default.query("SELECT * FROM users WHERE LOWER(email)=LOWER($1)", [email.trim().toLowerCase()]);
        if (rows[0]) {
            return rows[0];
        }
        else {
            return false;
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log("Error checking if email already exists: \n" + message);
        throw new Error("Error checking if email already exists: \n" + message);
    }
}
async function checkUsernameExists(username) {
    try {
        const { rows } = await pool_1.default.query("SELECT * FROM users WHERE username ILIKE $1", [username.trim()]);
        if (rows[0]) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log("Error while checking if username exists in db: \n" + message);
        throw new Error("Error checking username exists: \n" + message);
    }
}
async function checkSession(token, userID) {
    try {
        if (!userID || !token) {
            console.log("checkSession: No User Information to Validate");
            return false;
        }
        const { rows } = await pool_1.default.query("SELECT * FROM sessions WHERE session_id = $1 AND user_id = $2", [JSON.parse(token).sessionID, userID]);
        if (rows[0]) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error("Error cross referencing tokens and userID: \n" + message);
    }
}
async function getSessionBySessionID(sessionID) {
    try {
        if (sessionID !== undefined) {
            const { rows } = await pool_1.default.query("SELECT * FROM sessions WHERE session_id = $1", [sessionID]);
            if (rows.length > 0) {
                const userID = rows[0].user_id;
                return userID;
            }
            else {
                throw new Error("No session found with that ID");
            }
        }
        else {
            throw new Error("Session ID is undefined");
        }
    }
    catch (err) {
        const message = checkErrorType(err);
        console.error("Error getting session by Session ID: \n" + message);
        throw new Error("Error getting session by session ID: \n" + message);
    }
}
async function storeSession(userID, sessionID) {
    try {
        await pool_1.default.query(`
      INSERT INTO 
        sessions (session_id, user_id, created_at, expires_at) 
      VALUES 
        ($1, $2, NOW(), NOW() + INTERVAL '1 day')
      `, [sessionID, userID]);
        return;
    }
    catch (err) {
        const message = checkErrorType(err);
        console.error('Error storing user in session: \n' + message);
        throw new Error('Error storing session: \n' + message);
    }
}
async function deleteSession(sessionID) {
    try {
        await pool_1.default.query('DELETE FROM sessions WHERE session_id = ($1)', [
            sessionID,
        ]);
    }
    catch (err) {
        const message = checkErrorType(err);
        console.error('Error Deleting Session Data: \n' + message);
        throw new Error('Error deleting session with Session ID: \n' + message);
    }
}
async function cleanupSchedule() {
    try {
        await pool_1.default.query('DELETE FROM sessions WHERE expires_at<NOW();');
    }
    catch (err) {
        const message = checkErrorType(err);
        console.error('Error in scheduled database cleanup: \n' + message);
        throw new Error('Error in scheduled database cleanup: \n' + message);
    }
}
/////
/*

async function addMessageToConversations(message) {
  try {
    const data = await JSON.parse(message)
    if (data.conversationName) {
      const doesExist = await checkConversationByName(data.conversationName)
      if (doesExist) {
        await checkIfParticipant(data)
        const response = await addMessage(data)
        return response
      } else {
        await createConversationByName(data)
      }
    } else if (data.conversationID) {
      await addMessage(data)
    }
  } catch (err) {
    console.error('Error adding message to database: \n' + err.message)
    throw new Error('Error adding message to database: \n' + err.message)
  }
}


async function checkConversationByName(conversationName) {
  try {
    const conversation = await getConversationByName(conversationName)
    if (conversation) {
      return true
    } else {
      return false
    }
  } catch (err) {
    console.error(
      'Error checking if user is a part of the conversation: \n' + err.message,
    )
    throw new Error(
      'Error checking if user is a part of the conversation: \n' + err.message,
    )
  }
}

async function createConversationByName(data) {
  try {
    await pool.query('INSERT INTO conversations (name) VALUES ($1)', [
      data.conversationName,
    ])
    const conversation = await getConversationByName(data.conversationName)
    await addParticipant(conversation, data)
    await pool.query(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)',
      [conversation.id, data.userID, data.message],
    )
  } catch (err) {
    console.error(
      'Error creating conversation in database with name: \n' + err.message,
    )
    throw new Error(
      'Error creating conversation in database with name: \n' + err.message,
    )
  }
}

async function getConversationByName(name) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM conversations WHERE name = $1',
      [name],
    )
    return rows[0]
  } catch (err) {
    console.error('Error getting conversation by name: \n' + err.message)
    throw new Error('Error getting conversation by name: \n' + err.message)
  }
}

async function checkIfParticipant(data) {
  try {
    const conversation = await getConversationByName(data.conversationName)
    const participants = await getParticipantsByConversationID(conversation.id)

    const isParticipant = participants.some((participant) => {
      return participant.user_id === data.userID
    })

    if (!isParticipant) {
      await addParticipant(conversation.id, data.userID)
    }
  } catch (err) {
    console.err(
      'Error Checking if User is a participant of conversation: \n' + err,
    )
    throw new Error(
      'Error checking if user is a participant of conversation: \n' +
        err.message,
    )
  }
}*/
//# sourceMappingURL=queriesTyped.js.map