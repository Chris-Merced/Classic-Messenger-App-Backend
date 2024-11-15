const argon2 = require('argon2');
const db = require('../db/queries');


async function loginHandler(req, res) {
    try {
        const user = await db.getUserByUsername(req.body.username);
    
        if (user) {
            const passConfirm = await verifyPassword(user.password, req.body.password);
            if (passConfirm) {
                const sessionID = crypto.randomUUID();
                await db.storeSession(user.id, sessionID);
            
                const sessionToken = {
                    sessionID: sessionID
                }
            
                res.cookie('sessionToken', JSON.stringify(sessionToken), {
                    httpOnly: true,
                    secure: true,
                    sameSite: "Lax",
                    maxAge: 86400 * 1000
                })

                res.status(201).json({
                    message: "Server contact!"
                });

                console.log("cookie sent");
            } else {
                res.status(401).json({
                    message: "Incorrect Password"
                })
            }
        } else {
            res.status(402).json({ message: "Sorry there is no user that matches those credentials" })
        }
    } catch (err) {
        res.status(402).json({message: err})
    }
}

async function verifyPassword(hashedPassword, inputPassword) {
    try {
        const isMatch = await argon2.verify(hashedPassword, inputPassword);
        return isMatch;
    } catch(error) {
        console.error("Error in password Verification", error);
    }
}


module.exports = { loginHandler };