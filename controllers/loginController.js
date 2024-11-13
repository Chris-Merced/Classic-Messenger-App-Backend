const argon2 = require('argon2');
const db = require('../db/queries');


async function loginHandler(req, res) {
    const user = await db.getUser(req.body.username);
    
    if (user) {
        const passConfirm = await verifyPassword(user.password, req.body.password);
        if (passConfirm) {
            const sessionID = crypto.randomUUID();
            await db.storeSession(user.id, sessionID);
            
            const sessionToken = {
                sessionID: sessionID,
                userID: user.id
            }
            
            res.cookie('sessionToken', sessionToken, {
                httpOnly: true,
                secure: true,
                maxAge:  86400 * 1000
            })

            console.log("cookie sent");
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