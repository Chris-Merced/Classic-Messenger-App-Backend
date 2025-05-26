const db = require('../db/queries')
const crypto = require('crypto')

async function createSession(req, res) {
  const state = crypto.randomUUID()
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

    const tokenData = await tokenRes.json();

    if(tokenData.err){
        return res.status(400).json({error: tokenData.error_description});
    }
    console.log("Made it through token retrieval")

    //token needs to be sent back in order to gain email address
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    })

    const { email } = await userRes.json()

    console.log(email)

    

    //if email address exists -> create session and send back cookie with session id
    //else send back email address in object -> add new username to object -> 
    ////if username exists -> send back error try again
    ////else store username and email and create session -> send back cookie with session id
    //make sure to give option to create password later if desired by user

  } catch (err) {}
}

module.exports = { createSession }
