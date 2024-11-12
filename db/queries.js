const pool = require('./pool');

async function addUser(user) {
    console.log(user);
    await pool.query("INSERT INTO users (username,password) VALUES ($1, $2)", [user.username, user.password]);
    return;
}

async function getUser(username) {
    const {rows} = await pool.query("SELECT * FROM users WHERE username = ($1)", [username]);
    const user = rows[0];
    return user;
}

async function storeSession(userID, sessionID) {
    await pool.query("INSERT INTO sessions (session_id, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 day')", [sessionID, userID]);
    return;
}

module.exports = { addUser, getUser, storeSession };