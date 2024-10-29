const argon2 = require('argon2');
const db = require('../db/queries')


function signupHandler(req, res) {
    //const hashedPassword = hashPassword(password);
    db.addUser(req.body.user);

}

async function hashPassword(password) {
    try {
        const hash = await argon2.hash(password);
        return hash;
    } catch(error) {
        console.error(error);
    }
}

module.exports = {signupHandler}