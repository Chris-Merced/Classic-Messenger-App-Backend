const pool = require("./pool");

//PROOF OF CONCEPT FOR NAMED CHATS HAS BEEN APPLIED
//NOW NEED TO WORK ON APPLYING AN INFRASTRUCTURE FOR DMS
//WE ARE KINDA SO CLOSE

async function addUser(user) {
  try {
    await pool.query("INSERT INTO users (username,password, email) VALUES ($1, $2, $3)", [
      user.username,
      user.password,
      user.email,
    ]);
    return;
  } catch (err) {
    console.error("Error adding user " + err.message);
    throw new Error("Error adding user " + err.message);
  }
}

async function getUserByUsername(username) {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE username = ($1) ", [username]);
    const user = rows[0];
    return user;
  } catch (err) {
    console.error("Error getting user by username: " + err);
    throw new Error("Error getting user by username: " + err.message);
  }
}

async function getUsersByUsernameSearch(username) {
  try {
    const { rows } = await pool.query("SELECT * FROM USERS WHERE username ILIKE $1", [
      `%${username}%`,
    ]);
    const users = rows.map((row) => {
      const { id, username } = row;
      const newRow = { id, username };
      return newRow;
    });
    return users;
  } catch (err) {
    console.error("Problem getting users by username Search " + err.message);
    throw new Error("Problem getting users by username Search " + err.message);
  }
}

async function getUserByUserID(userID) {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [userID]);
    const user = rows[0];
    return user;
  } catch (err) {
    console.error("Error getting user by user ID " + err.message);
    throw new Error("Error getting user by user ID " + err.message);
  }
}

async function getUserBySession(token) {
  try {
    const { rows } = await pool.query("SELECT users.username FROM users JOIN sessions ON users.id=sessions.user_id WHERE session_id = $1", [token]);
    return rows[0];
  } catch (err) {
    console.error("Error getting the user ID by session");
  }
}

async function checkSession(token, userID) {
  try {
    if (!userID || !token) {
      console.log("checkSession: No User Information to Validate");
      return false;
    }
    const { rows } = await pool.query("SELECT * FROM sessions WHERE session_id = $1 AND user_id = $2", [token, userID]);
    if (rows[0].session_id) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error("Error cross referencing tokens and userID: " + err.message);
  }
}

async function getSessionBySessionID(sessionID) {
  try {
    if (sessionID !== undefined) {
      const { rows } = await pool.query("SELECT * FROM sessions WHERE session_id = $1", [
        sessionID,
      ]);

      if (rows.length > 0) {
        const userID = rows[0].user_id;
        return userID;
      } else {
        console.log("No session found with that ID");
      }
    } else {
      console.log("Session ID is undefined");
    }
  } catch (err) {
    console.error("Error getting session by Session ID " + err.message);
    throw new Error("Error getting session by session ID " + err.message);
  }
}

async function storeSession(userID, sessionID) {
  try {
    await pool.query(
      "INSERT INTO sessions (session_id, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 day')",
      [sessionID, userID]
    );
    return;
  } catch (err) {
    console.error("Error storing user in session:" + err.message);
    throw new Error("Error storing session " + err.message);
  }
}

async function deleteSession(sessionID) {
  try {
    await pool.query("DELETE FROM sessions WHERE session_id = ($1)", [sessionID]);
  } catch (err) {
    console.error("Error Deleting Session Data:" + err.message);
    throw new Error("Error deleting session with Session ID" + err.message);
  }
}

async function cleanupSchedule() {
  try {
    await pool.query("DELETE FROM sessions WHERE expires_at<NOW();");
  } catch (err) {
    console.error("Error in scheduled database cleanup" + err.message);
    throw new Error("Error in scheduled database cleanup" + err.message);
  }
}

async function addMessageToConversations(message) {
  try {
    const data = await JSON.parse(message);
    if (data.conversationName) {
      console.log("Made it past conversation name check for message");
      const doesExist = await checkConversationByName(data.conversationName);
      if (doesExist) {
        await checkIfParticipant(data);
        await addMessage(data);
      } else {
        await createConversationByName(data);
      }
    } else if (data.conversationID) {
      await addMessage(data);
    }
  } catch (err) {
    console.error("Error adding message to database " + err.message);
    throw new Error("Error adding message to database " + err.message);
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
    console.error("Error checking if user is a part of the conversation: " + err.message);
    throw new Error("Error checking if user is a part of the conversation " + err.message);
  }
}

async function createConversationByName(data) {
  try {
    await pool.query("INSERT INTO conversations (name) VALUES ($1)", [data.conversationName]);
    const conversation = await getConversationByName(data.conversationName);
    await addParticipant(conversation, data);
    await pool.query(
      "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)",
      [conversation.id, data.userID, data.message]
    );
  } catch (err) {
    console.error("Error creating conversation in database with name " + err.message);
    throw new Error("Error creating conversation in database with name: " + err.message);
  }
}

async function getConversationByName(name) {
  try {
    const { rows } = await pool.query("SELECT * FROM conversations WHERE name = $1", [name]);
    return rows[0];
  } catch (err) {
    console.error("Error getting conversation by name: " + err.message);
    throw new Error("Error getting conversation by name " + err.message);
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
      await addParticipant(conversation.id, data.userID);
    }
  } catch (err) {
    console.err("Error Checking if User is a participant of conversation: " + err);
    throw new Error("Error checking if user is a participant of conversation " + err.message);
  }
}

async function addParticipant(conversation_id, user_id) {
  try {
    await pool.query(
      "INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)",
      [conversation_id, user_id]
    );
  } catch (err) {
    console.error("Error adding participant to conversation " + err.message);
    throw new Error("Error adding participant to conversation " + err.message);
  }
}

async function getParticipantsByConversationID(conversationID) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM conversation_participants WHERE conversation_id = $1",
      [conversationID]
    );
    return rows;
  } catch (err) {
    console.error("Error finding conversation participants by conversation ID: " + err.message);
    throw new Error("Error finding conversation participants by conversation ID " + err.message);
  }
}

async function addMessage(data) {
  try {
    await pool.query(
      "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)",
      [data.conversationID, data.userID, data.message]
    );
  } catch (err) {
    console.error("Error adding message to the database: " + err.message);
    throw new Error("Error adding message to the database " + err.message);
  }
}

async function getChatMessagesByName(name) {
  try {
    const conversation = await getConversationByName(name);
    const rows = await getChatMessagesByConversationID(conversation.id);
    return rows;
  } catch (err) {
    console.error("Error retrieving messages from database " + err.message);
    throw new Error("Error getting chat messages by name " + err.message);
  }
}

async function getChatMessagesByConversationID(conversationID) {
  try {
    if (!conversationID || conversationID === "undefined") {
      console.log("getChatMessagesByConversationID: No user information to retrieve messages for");
      return;
    }
    const { rows } = await pool.query("SELECT * FROM messages WHERE conversation_id = $1", [
      conversationID,
    ]);
    return rows;
  } catch (err) {
    console.error("Error retrieving the chat messages by conversationID: " + err.message);
    throw new Error("Error retrieving chat messages by conversationID: " + err.message);
  }
}

async function getUserChats(userID) {
  try {
    const { rows } = await pool.query(
      "SELECT conversation_participants.conversation_id, conversations.is_group, conversations.name FROM conversation_participants JOIN conversations ON conversations.id = conversation_participants.conversation_id WHERE user_id = $1",
      [userID]
    );

    const chatList = await Promise.all(
      rows.map(async (row) => {
        if (!row.name) {
          const participants = await getParticipantsByConversationID(row.conversation_id);
          const names = await parseNamesByUserID(participants, userID);

          return { ...row, participants: names };
        } else {
          return { ...row, participants: null };
        }
      })
    );

    return chatList;
  } catch (err) {
    console.error("Error retrieving user chats: " + err.message);
    throw new Error("Error retrieving user chats: " + err.message);
  }
}

async function parseNamesByUserID(participants, userID) {
  const ids = participants.map((participant) => {
    const id = participant.user_id;
    return id;
  });
  const filtered = ids.filter((id) => {
    return Number(id) != Number(userID);
  });

  const names = Promise.all(
    filtered.map(async (id) => {
      const { rows } = await pool.query("SELECT users.username FROM users WHERE id=$1", [id]);
      return rows[0].username;
    })
  );
  return names;
}

async function checkDirectMessageConversationExists(userID, profileID) {
  const { rows } = await pool.query(
    "SELECT cp.conversation_id FROM conversation_participants cp WHERE cp.conversation_id IN ( SELECT conversation_id FROM conversation_participants GROUP BY conversation_id HAVING COUNT(*) = 2)AND cp.conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id IN ($1, $2) GROUP BY conversation_id HAVING COUNT(*) = 2)",
    [userID, profileID]
  );
  if (rows[0]) {
    return true;
  } else {
    const { rows } = await pool.query("INSERT INTO conversations DEFAULT VALUES RETURNING id");
    const conversation_id = rows[0].id;
    await addParticipant(conversation_id, userID);
    await addParticipant(conversation_id, profileID);

    return true;
  }
}



module.exports = {
  addUser,
  getUserByUsername,
  storeSession,
  cleanupSchedule,
  checkSession,
  getSessionBySessionID,
  getUserByUserID,
  getUserBySession,
  deleteSession,
  getUsersByUsernameSearch,
  addMessageToConversations,
  getChatMessagesByName,
  getChatMessagesByConversationID,
  getUserChats,
  checkDirectMessageConversationExists,
};
