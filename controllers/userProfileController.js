const db = require('../db/queries');

// MAKE SURE THE SESSION EXISTS AND IS NOT EXPIRES
//IF EXPIRED OR NONEXISTENT SEND BACK NULL USER DATA IN THE JSON WITH APPROPRAITE MESSAGE
//IF NOT EXPIRED THEN SEND BACK RELEVANT USER DATA TO THE FRONT END.
// FRONT END NEEDS TO BE MODIFIED SO THAT ON LOGIN THE RELEVANT USER DATA IS IMMEDIATELY GIVEN 

const getUser = () => {
    console.log("You made it to the user fetch area!");
    return;
}

module.exports = {getUser}