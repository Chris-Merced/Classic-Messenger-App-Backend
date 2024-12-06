const pool = require('./pool');

//PROOF OF CONCEPT FOR NAMED CHATS HAS BEEN APPLIED
//NOW NEED TO WORK ON APPLYING AN INFRASTRUCTURE FOR DMS
//WE ARE KINDA SO CLOSE 

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
        console.error("Problem with lookup: ", err)
        throw err;
    }
}

async function getUserByUserID(userID) {
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [userID]);
        const user = rows[0];
        return user;
    } catch (err) {
        console.error("Error getting user from database with userID: ", err);
    }
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
    } catch (err) {
        console.error("Error cleaning up sessions", err);
    }
}

async function addMessageToConversations(message) {
    try {
        const data = await JSON.parse(message);
        //If Conversation Has A Name
        if (data.conversationName) {
            const doesExist = await checkConversationByName(data.conversationName);
            if (doesExist) {
                await checkIfParticipant(data);
                await addMessage(data);
            } else {
                await createConversationByName(data)
            };
        }
        //If Conversation Does Not Have A Name (DM's)
        else {

        };
    } catch (err) {
        console.error("Error adding message to database", err);
    }
}

async function checkConversationByName(conversationName, res) {
    try {
        const conversation = await getConversationByName(conversationName);
        if (conversation) {
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
        const conversation = await getConversationByName(data.conversationName);
        await addParticipant(conversation, data);
        await pool.query("INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)", [conversation.id, data.userID, data.message]);
    } catch (err) {
        console.error("Error adding the conversation to the database by name", err);
    }
}

async function getConversationByName(name) {
    try {
        const { rows } = await pool.query("SELECT * FROM conversations WHERE name = $1", [name]);
        return rows[0];
    } catch (err) {
        console.error("Error getting conversation by name: ", err);
    }
}

async function checkIfParticipant(data) {
    try {
        const conversation = await getConversationByName(data.conversationName);
        const participants = await getParticipantsByConversationID(conversation.id);
    
        const isParticipant = participants.some((participant) => {
            return participant.user_id === data.userID;
        });
    
        if (!isParticipant) {
            await addParticipant(conversation, data);
        }
    } catch (err) {
        console.err("Error Checking if User is a participant of conversation: ", err);
    }
}

async function addParticipant(conversation, data) {
    await pool.query("INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)", [conversation.id, data.userID]);
}

async function getParticipantsByConversationID(conversationID) {
    try {
        const { rows } = await pool.query("SELECT * FROM conversation_participants WHERE conversation_id = $1", [conversationID]);
        return rows;
    } catch (err) {
        console.error("Error finding conversation participants by conversation ID: ", err);
    }
}

async function addMessage(data) {
    try {
        const conversation = await getConversationByName(data.conversationName);
        await pool.query("INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)", [conversation.id, data.userID, data.message]);
    } catch (err) {
        console.error("Error adding message to the database: ", err);
    }
        
}

async function getChatMessagesByName(name) {
    try {
        const conversation = await getConversationByName(name);
        const { rows } = await pool.query("SELECT * FROM messages WHERE conversation_id = $1", [conversation.id]);
        return rows
    }catch(err){console.error("Error retrieving messages from database", err)}
}

module.exports = { addUser, getUserByUsername, storeSession, cleanupSchedule, getSession, getUserByUserID, deleteSession, getUsersByUsernameSearch, addMessageToConversations, getChatMessagesByName};