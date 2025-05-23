const db = require('../db/queries')
const crypto = require('crypto')

async function createSession(req, res) {
  const state = crypto.randomUUID()
  const code = req.body.code
  console.log(code)

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
    console.log(tokenData);

  } catch (err) {}
}

module.exports = { createSession }
