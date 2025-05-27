const db = require('../db/queries')
const crypto = require('crypto')

async function oauthLogin(req, res) {
  const code = req.body.code

  if (!code) {
    res.status(400).json({ error: 'Missing Code' })
  }
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.OAUTH_CLIENTID,
        client_secret: process.env.OAUTH_SECRET,
        redirect_uri: process.env.FRONTEND_OAUTH_URL,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()

    if (tokenData.err) {
      return res.status(400).json({ error: tokenData.error_description })
    }
    console.log('Made it through token retrieval')

    const userRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    )

    const { email } = await userRes.json()

    const emailStatus = await db.checkEmailExists(email)
    if (emailStatus) {
      //if email address exists -> create session and send back cookie with session id
      const user = emailStatus
      console.log('USER INFO')
      console.log(user)

      const sessionID = crypto.randomUUID()
      await db.storeSession(user.id, sessionID)

      const sessionToken = {
        sessionID: sessionID,
      }

      res.cookie('sessionToken', JSON.stringify(sessionToken), {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 86400 * 1000,
      })

      res.status(201).json({
        username: user.username,
        id: user.id,
      })

      console.log('cookie sent')
    } else {
      console.log('Made it to the negative')
      res
        .status(200)
        .json({
          status: 'signup incomplete',
          message: 'Authentication passed but user is not in the system',
          email: `${email}`,
        })

      //else send back email address in object -> add new username to object ->
      ////if username exists -> send back error try again
      ////else store username and email and create session -> send back cookie with session id
    }

    //make sure to give option to create password later if desired by user
  } catch (err) {
    console.log('Error during OAuth: \n' + err.message)
    res.status(500).json({ error: 'Error during OAuth Login' })
  }
}

async function oauthSignup(req, res) {
  try {
    console.log('made it to oauthSignup')
  } catch (err) {
    console.log(
      'There was an error attempting to signup in the OAuth process: \n' + err,
    )
    res.status(500).json({ error: 'Error in OAuth signup prcoess' })
  }
}

module.exports = { oauthLogin, oauthSignup }
