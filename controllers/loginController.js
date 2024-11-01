const argon2 = require('argon2');


//need to add in login authentication and handling along with
//session management


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