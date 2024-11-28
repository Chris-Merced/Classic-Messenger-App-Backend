const pool = require('./pool');

async function addUser(user) {
    try {
        await pool.query("INSERT INTO users (username,password) VALUES ($1, $2)", [user.username, user.password]);
        return;
    } catch(err) {
        throw err;
    }
}

async function getUserByUsername(username) {
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE username = ($1)", [username]);
        const user = rows[0];
        return user;
    } catch(err) {
        console.error("Error getting user information:", err);
        throw err;
    }
}

async function getUsersByUsernameSearch(username) {
    try {
        const {rows} = await pool.query("SELECT * FROM USERS WHERE username ILIKE $1", [`%${username}%`])
        const users = rows.map((row) => {
            const { id, username } = row;
            const newRow = { id, username };
            return newRow;
        })
        return users;
    } catch (err) {
        console.log("Problem with lookup: ", err)
        throw err;
    }
}

async function getUserByUserID(userID) {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [userID]);
    const user = rows[0];
    return user;
}

async function getSession(sessionID) {
    try {
        const { rows } = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionID]);
        const userID = rows[0].user_id;
        return userID;
    } catch (err) {
        console.error("No user information found");
    }
}

async function storeSession(userID, sessionID) {
    try{await pool.query("INSERT INTO sessions (session_id, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 day')", [sessionID, userID]);
        return;
    } catch (err) {
        console.error("Error storing user in session:", err);
        throw err;
    }
}

async function deleteSession(sessionID) {
    try {
        await pool.query("DELETE FROM sessions WHERE session_id = ($1)", [sessionID]);
    } catch (err) {
        console.error("Error Deleting Session Data:", err);
        throw err;
    }   
}


async function cleanupSchedule() {
    try {
        await pool.query("DELETE FROM sessions WHERE expires_at<NOW();");
        console.log("Deleted expired session");
    } catch (err) {
        console.error("Error cleaning up sessions", err);
    }
}



module.exports = { addUser, getUserByUsername, storeSession, cleanupSchedule, getSession, getUserByUserID, deleteSession, getUsersByUsernameSearch};