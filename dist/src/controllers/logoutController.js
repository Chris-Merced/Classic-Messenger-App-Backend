"use strict";
const db = require('../db/queries');
async function logoutUser(req, res) {
    try {
        const data = JSON.parse(req.cookies.sessionToken);
        await db.deleteSession(data.sessionID);
        res.status(200).json({ message: 'Logout Successful' });
    }
    catch (err) {
        console.error('Error in logging out user: ' + err.message);
        res
            .status(500)
            .json({ message: 'Error in logging out user: ' + err.message });
    }
}
module.exports = { logoutUser };
//# sourceMappingURL=logoutController.js.map