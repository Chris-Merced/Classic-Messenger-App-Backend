const argon2 = require('argon2');
const db = require('../db/queries')


async function signupHandler(req, res) {
    try {
        const hashedPassword = await hashPassword(req.body.password);
        const user = { ...req.body, password: hashedPassword }
        
        console.log(req.body);
        await db.addUser(user);
        res.status(201).json({ message: "User Created Successfully" });
    } catch (error) {
        console.error("Error Adding User", error);
        res.status(500).json({ error: "Error adding user"});
    }

}

async function hashPassword(password) {
    try {
        const hash = await argon2.hash(password);
        return hash;
    } catch(error) {
        throw error;
    }
}

module.exports = {signupHandler}