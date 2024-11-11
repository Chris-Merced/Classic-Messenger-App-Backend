const argon2 = require('argon2');
const db = require('../db/queries');

//ADD IN SSUID TO CREATE SESSION
//ADD SSUID TO DATABASE WITH USER ID
//SEND COOKIE TO CLIENT WITH SESSION ID
//SEND RES TO CONFIRM CLIENT CONTACT AND ADDITION
//SWITCH TO FRONT END TO REFLECT THE LOGIN CHANGES



async function loginHandler(req, res) {
    const user = await db.getUser(req.body.username);
    if (user) {
        const passConfirm = await verifyPassword(user.password, req.body.password);
        if (passConfirm) {
            console.log("wow you did it!")
        } else {
            res.status(401).json({
                message: "Incorrect Password"
            })
        }
    } else {
        res.status(402).json({ message: "Sorry there is no user that matches those credentials" })
    }
    res.status(201).json({
        message: "Server contact!"
    });
}

async function verifyPassword(hashedPassword, inputPassword) {
    try {
        const isMatch = await argon2.verify(hashedPassword, inputPassword);
        return isMatch;
    } catch(error) {
        console.error("Error in password Verification", error);
    }
}

function createSession(id) {
    const sessionID = crypto.rand()
}

module.exports = { loginHandler };