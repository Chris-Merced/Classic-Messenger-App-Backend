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

module.exports = { addUser, getUser };