const argon2 = require('argon2');

function loginHandler(req, res) {
    req.body.password
}

async function hashPassword(password) {
    try {
        const hash = await argon2.hash(password);
        return hash;
    } catch(error) {
        console.error(error);
    }
}


module.exports = { loginHandler };