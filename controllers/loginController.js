const argon2 = require("argon2");
const crypto = require("crypto");
const db = require("../db/queries");

async function loginHandler(req, res) {
  try {
    console.log("HELLLLOOOOOOO")
    const user = await db.getUserByUsername(req.body.username);

    if (user) {
      const passConfirm = await verifyPassword(user.password, req.body.password);
      if (passConfirm) {
        const sessionID = crypto.randomUUID();
        await db.storeSession(user.id, sessionID);

        const sessionToken = {
          sessionID: sessionID,
        };

        res.cookie("sessionToken", JSON.stringify(sessionToken), {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 86400 * 1000,
        });

        res.status(201).json({
          username: user.username,
          id: user.id,
        });

        console.log("cookie sent");
      } else {
        res.status(401).json({
          message: "Incorrect Password",
        });
      }
    } else {
      res.status(404).json({
        message: "Sorry there is no user that matches those credentials",
      });
    }
  } catch (err) {
    console.error("Error in Handling Login: " + err.message);
    res.status(401).json({ message: "Error: " + err.message });
  }
}

async function verifyPassword(hashedPassword, inputPassword) {
  try {
    const isMatch = await argon2.verify(hashedPassword, inputPassword);
    return isMatch;
  } catch (err) {
    console.error("Error in password verification: " + err.message);
    throw new Error("Error in password verification: " + err.message);
  }
}

module.exports = { loginHandler };
