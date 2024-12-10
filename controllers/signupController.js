const argon2 = require("argon2");
const db = require("../db/queries");

async function signupHandler(req, res) {
  try {
    const hashedPassword = await hashPassword(req.body.password);
    const user = { ...req.body, password: hashedPassword };

    await db.addUser(user);
    res.status(201).json({ message: "User Created Successfully" });
  } catch (err) {
    console.error("Error Adding User", err.message);
    res.status(500).json({ message: "Error: " + err.message });
  }
}

async function hashPassword(password) {
  try {
    const hash = await argon2.hash(password);
    return hash;
  } catch (err) {
    throw err;
  }
}

module.exports = { signupHandler };
