const db = require('../db/queries')

async function createSession(req, res){
    console.log("Activated create Session")
    console.log(req.body.hash)


        
}

module.exports = {createSession}