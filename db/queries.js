const pool = require('./pool');

async function addUser(user) {
    console.log(user);
    await pool.query("INSERT INTO users (username,password) VALUES ($1, $2)", [user.username, user.password]);
    return;
}

module.exports = { addUser };