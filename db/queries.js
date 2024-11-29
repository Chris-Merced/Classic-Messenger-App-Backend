const pool = require('./pool');

//GO TO FUNCTION AT LINE 82
//THIS FUNCTION CHECKS IF A CONVERSATION WITH A MATCHING NAME EXISTS AND 
//SPLITS BASED ON THE EXISTENCE OF THE NAMED CONVERSATION
//IT SEEMS AS THOUGH THE PRGORAM IS NOT MAKING IT TO THE LOG "DOES EXIST!"
//EVEN IF THE CONVERSATION DOES ALREADY EXIST
//MAKE SURE BOOLEAN VALUES ARE BEING CHECKED CORRECTLY FOR CONVERSATION NAME "MAIN" EXISTING THROUGH THE DB QUERY


async function addUser(user) {
    try {
        await pool.query("INSERT INTO users (username,password) VALUES ($1, $2)", [user.username, user.password]);
        return;
    } catch(err) {
        throw err;
    }
}

async function getUserByUsername(username) {
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE username = ($1)", [username]);
        const user = rows[0];
        return user;
    } catch(err) {
        console.error("Error getting user information:", err);
        throw err;
    }
}

async function getUsersByUsernameSearch(username) {
    try {
        const {rows} = await pool.query("SELECT * FROM USERS WHERE username ILIKE $1", [`%${username}%`])
        const users = rows.map((row) => {
            const { id, username } = row;
            const newRow = { id, username };
            return newRow;
        })
        return users;
    } catch (err) {
        console.log("Problem with lookup: ", err)
        throw err;
    }
}

async function getUserByUserID(userID) {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [userID]);
    const user = rows[0];
    return user;
}

async function getSession(sessionID) {
    try {
        const { rows } = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionID]);
        const userID = rows[0].user_id;
        return userID;
    } catch (err) {
        console.error("No user information found");
    }
}

async function storeSession(userID, sessionID) {
    try{await pool.query("INSERT INTO sessions (session_id, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 day')", [sessionID, userID]);
        return;
    } catch (err) {
        console.error("Error storing user in session:", err);
        throw err;
    }
}

async function deleteSession(sessionID) {
    try {
        await pool.query("DELETE FROM sessions WHERE session_id = ($1)", [sessionID]);
    } catch (err) {
        console.error("Error Deleting Session Data:", err);
        throw err;
    }   
}


async function cleanupSchedule() {
    try {
        await pool.query("DELETE FROM sessions WHERE expires_at<NOW();");
        console.log("Deleted expired session");
    } catch (err) {
        console.error("Error cleaning up sessions", err);
    }
}

async function addMessageToConversations(message) {
    const data = await JSON.parse(message);
    if (data.conversationName) {
        const doesExist = await CheckConversationByName(data.conversationName);
        console.log(doesExist);
        if (doesExist) {
            console.log("it exists!")
        }else{await createConversationByName(data)};
    };
}

async function CheckConversationByName(res, conversationName) {
    try {
        const { rows } = await pool.query("SELECT * FROM conversations WHERE name = $1", [conversationName])
        if (rows[0]) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.error("Error checking database name: " + err);
        res.status(401).json({ message: "Error Checking Database Name: " + err });
    }
}

async function createConversationByName(data) {
    try {
        await pool.query("INSERT INTO conversations (name) VALUES ($1)", [data.conversationName]);
        const { rows } = await pool.query("SELECT * FROM conversations WHERE name = $1", [data.conversationName]);
        console.log(rows[0]);
        console.log(data);
        await pool.query("INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)", [rows[0].id, data.userID]);
        await pool.query("INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)", [rows[0].id, data.userID, data.message]);
    } catch (err) {
        
        console.error("Error adding the conversation to the database by name"+ err);
    }
}

module.exports = { addUser, getUserByUsername, storeSession, cleanupSchedule, getSession, getUserByUserID, deleteSession, getUsersByUsernameSearch, addMessageToConversations};