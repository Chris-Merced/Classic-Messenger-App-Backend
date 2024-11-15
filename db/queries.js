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

async function getUserByUserID(userID) {
    console.log(userID);
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [userID]);
    console.log(rows);
    const user = rows[0];
    return user;
}

async function getSession(sessionID) {
    const { rows } = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionID]);
    console.log(rows[0]);
    const userID = rows[0].user_id;
    return userID;
}

async function storeSession(userID, sessionID) {
    try{await pool.query("INSERT INTO sessions (session_id, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 day')", [sessionID, userID]);
        return;
    } catch (err) {
        console.error("Error storing user in session:", err)
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



module.exports = { addUser, getUserByUsername, storeSession, cleanupSchedule, getSession, getUserByUserID };