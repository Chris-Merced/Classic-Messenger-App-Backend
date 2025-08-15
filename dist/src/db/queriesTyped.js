"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
const userChema = z.object({

})


async function addUser(user) {
  try {
    let userNameData = await pool.query(
      'SELECT * FROM users WHERE username ILIKE $1',
      [user.username.trim()],
    )
    if (
      userNameData.rows[0] &&
      userNameData.rows[0].username.toLowerCase() ===
        user.username.trim().toLowerCase()
    ) {
      console.log('User Already Exists')
      throw new Error('User Already Exists')
    }

    let emailData = await pool.query(
      'SELECT * FROM users WHERE LOWER(email)=LOWER($1)',
      [user.email.trim()],
    )

    if (emailData.rows[0]) {
      console.log('Email already in use')
      throw new Error('Email Already In Use')
    }

    await pool.query(
      'INSERT INTO users (username,password, email) VALUES ($1, $2, $3)',
      [user.username.trim(), user.password, user.email.trim().toLowerCase()],
    )
    const id = await getUserIDByUsername(user.username.trim())
    await addParticipant(1, id)
    return
  } catch (err) {
    console.log('Error attempting to add user: \n' + err.message)
    throw new Error(err.message)
  }
}*/
//# sourceMappingURL=queriesTyped.js.map