const db = require('../db/queries');


//WE HAVE FIGURED OUT HOW TO ACTUALLY REQUEST AND STORE COOKIES ON FRONT END
// MAKE SURE THE SESSION EXISTS AND IS NOT EXPIRES
//IF EXPIRED OR NONEXISTENT SEND BACK NULL USER DATA IN THE JSON WITH APPROPRAITE MESSAGE
//IF NOT EXPIRED THEN SEND BACK RELEVANT USER DATA TO THE FRONT END.
// FRONT END NEEDS TO BE MODIFIED SO THAT ON LOGIN THE RELEVANT USER DATA IS IMMEDIATELY GIVEN 

async function getUser(req, res) {
    console.log("You made it to the user fetch area!");
    const sessionData = JSON.parse(req.cookies.sessionToken)
    if (sessionData.sessionID) { console.log(sessionData.sessionID) }
    else { return res.status(200).json({message: "No SessionID Stored"})};
}

module.exports = {getUser}