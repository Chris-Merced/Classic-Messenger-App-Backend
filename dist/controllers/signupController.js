"use strict";
const argon2 = require('argon2');
const db = require('../db/queries');
async function signupHandler(req, res) {
    try {
        const hashedPassword = await hashPassword(req.body.password);
        const user = { ...req.body, password: hashedPassword };
        await db.addUser(user);
        res.status(201).json({ message: 'User Created Successfully' });
    }
    catch (err) {
        res.status(409).json({ message: err.message });
    }
}
async function hashPassword(password) {
    try {
        const hash = await argon2.hash(password);
        return hash;
    }
    catch (err) {
        console.error('Error hashing password: ' + err.message);
        throw new Error('Error hashing password: ' + err.message);
    }
}
module.exports = { signupHandler };
//# sourceMappingURL=signupController.js.map