const argon2 = require('argon2');


//ADD IN LOGIN HANDLING AND INTERACTION WITH DB
//ADD IN SSUID TO CREATE SESSION
//ADD SSUID TO DATABASE WITH USER ID
//SEND COOKIE TO CLIENT WITH SESSION ID
//SEND RES TO CONFIRM CLIENT CONTACT AND ADDITION
//SWITCH TO FRONT END TO REFLECT THE LOGIN CHANGES



function loginHandler(req, res) {
    
    res.status(201).json({
        message: "Server contact!"
    });
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