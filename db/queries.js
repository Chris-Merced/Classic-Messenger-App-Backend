const { request } = require('express')
const pool = require('./pool')
const crypto = require('crypto')
const argon2 = require('argon2')

async function addUser(user) {
  try {
    let userNameData = await pool.query(
      'SELECT * FROM users WHERE username ILIKE $1',
      [user.username.trim()],
    )
    if (
      userNameData.rows[0] &&
      userNameData.rows[0].username.toLowerCase() ===
        user.username.trim().toLowerCase()
    ) {
      console.log('User Already Exists')
      throw new Error('User Already Exists')
    }

    let emailData = await pool.query(
      'SELECT * FROM users WHERE LOWER(email)=LOWER($1)',
      [user.email.trim()],
    )

    if (emailData.rows[0]) {
      console.log('Email already in use')
      throw new Error('Email Already In Use')
    }

    await pool.query(
      'INSERT INTO users (username,password, email) VALUES ($1, $2, $3)',
      [user.username.trim(), user.password, user.email.trim().toLowerCase()],
    )
    const id = await getUserIDByUsername(user.username.trim())
    await addParticipant(1, id)
    return
  } catch (err) {
    console.log('Error attempting to add user: \n' + err.message)
    throw new Error(err.message)
  }
}

async function addUserOAuth(email, username) {
  try {
    const tempPassword = crypto.randomUUID()
    const hashedPassword = await argon2.hash(tempPassword)

    const response = await pool.query(
      'INSERT INTO users (username,password, email) VALUES ($1, $2, $3)',
      [username.trim(), hashedPassword, email.trim().toLowerCase()],
    )
    const id = await getUserIDByUsername(username.trim())
    await addParticipant(1, id)
    return id
  } catch (err) {
    console.log(
      'Error adding user to database via OAuth method: \n' + err.message,
    )
    throw new Error(
      'Error adding user to database via OAuth method: \n' + err.message,
    )
  }
}

async function getUserIDByUsername(username) {
  try {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE LOWER(username)=LOWER($1)',
      [username.toLowerCase()],
    )
    if (rows[0]) {
      return rows[0].id
    } else {
      console.log('Within getUserIDByUsername: \n Username does not exist')
    }
  } catch (err) {
    console.log(
      'There was an error in retrieving User ID By Username: \n' + err,
    )
  }
}

async function getUserByUsername(username) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE LOWER(username)=LOWER($1) ',
      [username],
    )
    const user = rows[0]
    return user
  } catch (err) {
    console.error('Error getting user by username: \n' + err)
    throw new Error('Error getting user by username: \n' + err.message)
  }
}

async function getUsersByUsernameSearch(username) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM USERS WHERE username ILIKE $1',
      [`%${username}%`],
    )
    const users = rows.map((row) => {
      const { id, username } = row
      const newRow = { id, username }
      return newRow
    })
    return users
  } catch (err) {
    console.error('Problem getting users by username Search: \n' + err.message)
    throw new Error(
      'Problem getting users by username Search: \n' + err.message,
    )
  }
}

async function getUserByUserID(userID) {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [
      userID,
    ])
    const userData = rows[0]
    const { password, ...user } = userData
    return user
  } catch (err) {
    console.error('Error getting user by user ID: \n' + err.message)
    throw new Error('Error getting user by user ID: \n' + err.message)
  }
}

async function getUserBySession(token) {
  try {
    const { rows } = await pool.query(
      `
      SELECT 
        users.username 
      FROM 
        users 
      JOIN 
        sessions ON users.id=sessions.user_id 
      WHERE 
        session_id = $1
      `,
      [token],
    )
    return rows[0]
  } catch (err) {
    console.error('Error getting the user ID by session: \n' + err.message)
  }
}

async function checkEmailExists(email) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE LOWER(email)=LOWER($1)',
      [email.trim().toLowerCase()],
    )
    if (rows[0]) {
      return rows[0]
    } else {
      return false
    }
  } catch (err) {
    console.log('Error checking if email already exists: \n' + err.message)
    throw new Error('Error checking if email already exists: \n' + err.message)
  }
}

async function checkUsernameExists(username) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username ILIKE $1',
      [username.trim()],
    )
    if (rows[0]) {
      return true
    } else {
      return false
    }
  } catch (err) {
    console.log(
      'Error while checking if username exists in db: \n' + err.message,
    )
    throw new Error('Error checking username exists: \n' + err.message)
  }
}

async function checkSession(token, userID) {
  try {
    if (!userID || !token) {
      console.log('checkSession: No User Information to Validate')
      return false
    }
    const { rows } = await pool.query(
      'SELECT * FROM sessions WHERE session_id = $1 AND user_id = $2',
      [JSON.parse(token).sessionID, userID],
    )
    if (rows[0]) {
      return true
    } else {
      return false
    }
  } catch (err) {
    console.error('Error cross referencing tokens and userID: \n' + err.message)
  }
}

async function getSessionBySessionID(sessionID) {
  try {
    if (sessionID !== undefined) {
      const { rows } = await pool.query(
        'SELECT * FROM sessions WHERE session_id = $1',
        [sessionID],
      )

      if (rows.length > 0) {
        const userID = rows[0].user_id
        return userID
      } else {
        console.log('No session found with that ID')
      }
    } else {
      console.log('Session ID is undefined')
    }
  } catch (err) {
    console.error('Error getting session by Session ID: \n' + err.message)
    throw new Error('Error getting session by session ID: \n' + err.message)
  }
}

async function storeSession(userID, sessionID) {
  try {
    await pool.query(
      `
      INSERT INTO 
        sessions (session_id, user_id, created_at, expires_at) 
      VALUES 
        ($1, $2, NOW(), NOW() + INTERVAL '1 day')
      `,
      [sessionID, userID],
    )
    return
  } catch (err) {
    console.error('Error storing user in session: \n' + err.message)
    throw new Error('Error storing session: \n' + err.message)
  }
}

async function deleteSession(sessionID) {
  try {
    await pool.query('DELETE FROM sessions WHERE session_id = ($1)', [
      sessionID,
    ])
  } catch (err) {
    console.error('Error Deleting Session Data: \n' + err.message)
    throw new Error('Error deleting session with Session ID: \n' + err.message)
  }
}

async function cleanupSchedule() {
  try {
    await pool.query('DELETE FROM sessions WHERE expires_at<NOW();')
  } catch (err) {
    console.error('Error in scheduled database cleanup: \n' + err.message)
    throw new Error('Error in scheduled database cleanup: \n' + err.message)
  }
}

async function addMessageToConversations(message) {
  try {
    const data = await JSON.parse(message)
    if (data.conversationName) {
      const doesExist = await checkConversationByName(data.conversationName)
      if (doesExist) {
        await checkIfParticipant(data)
        const response = await addMessage(data)
        return response
      } else {
        await createConversationByName(data)
      }
    } else if (data.conversationID) {
      await addMessage(data)
    }
  } catch (err) {
    console.error('Error adding message to database: \n' + err.message)
    throw new Error('Error adding message to database: \n' + err.message)
  }
}

async function checkConversationByName(conversationName, res) {
  try {
    const conversation = await getConversationByName(conversationName)
    if (conversation) {
      return true
    } else {
      return false
    }
  } catch (err) {
    console.error(
      'Error checking if user is a part of the conversation: \n' + err.message,
    )
    throw new Error(
      'Error checking if user is a part of the conversation: \n' + err.message,
    )
  }
}

async function createConversationByName(data) {
  try {
    await pool.query('INSERT INTO conversations (name) VALUES ($1)', [
      data.conversationName,
    ])
    const conversation = await getConversationByName(data.conversationName)
    await addParticipant(conversation, data)
    await pool.query(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)',
      [conversation.id, data.userID, data.message],
    )
  } catch (err) {
    console.error(
      'Error creating conversation in database with name: \n' + err.message,
    )
    throw new Error(
      'Error creating conversation in database with name: \n' + err.message,
    )
  }
}

async function getConversationByName(name) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM conversations WHERE name = $1',
      [name],
    )
    return rows[0]
  } catch (err) {
    console.error('Error getting conversation by name: \n' + err.message)
    throw new Error('Error getting conversation by name: \n' + err.message)
  }
}

async function checkIfParticipant(data) {
  try {
    const conversation = await getConversationByName(data.conversationName)
    const participants = await getParticipantsByConversationID(conversation.id)

    const isParticipant = participants.some((participant) => {
      return participant.user_id === data.userID
    })

    if (!isParticipant) {
      await addParticipant(conversation.id, data.userID)
    }
  } catch (err) {
    console.err(
      'Error Checking if User is a participant of conversation: \n' + err,
    )
    throw new Error(
      'Error checking if user is a participant of conversation: \n' +
        err.message,
    )
  }
}

async function addParticipant(conversation_id, user_id) {
  try {
    await pool.query(
      'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)',
      [conversation_id, user_id],
    )
  } catch (err) {
    console.error('Error adding participant to conversation: \n' + err.message)
    throw new Error(
      'Error adding participant to conversation: \n' + err.message,
    )
  }
}

async function getParticipantsByConversationID(conversationID) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM conversation_participants WHERE conversation_id = $1',
      [conversationID],
    )
    return rows
  } catch (err) {
    console.error(
      'Error finding conversation participants by conversation ID: ' +
        err.message,
    )
    throw new Error(
      'Error finding conversation participants by conversation ID ' +
        err.message,
    )
  }
}

async function addMessage(data) {
  try {
    const response = await pool.query(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)',
      [data.conversationID, data.userID, data.message],
    )
    return response
  } catch (err) {
    console.error('Error adding message to the database: \n' + err.message)
    throw new Error('Error adding message to the database: \n' + err.message)
  }
}

async function getChatMessagesByName(name, page, limit) {
  try {
    const conversation = await getConversationByName(name)
    const rows = await getChatMessagesByConversationID(
      conversation.id,
      page,
      limit,
    )
    return rows
  } catch (err) {
    console.error('Error retrieving messages from database: \n ' + err.message)
    throw new Error('Error getting chat messages by name: \n ' + err.message)
  }
}

async function getChatMessagesByConversationID(conversationID, page, limit) {
  try {
    if (!conversationID || conversationID === 'undefined') {
      console.log(
        'getChatMessagesByConversationID: No user information to retrieve messages for',
      )
      return
    }
    
    const offset = page * 20
    
    const { rows } = await pool.query(
      `
      SELECT * 
      FROM 
        (
          SELECT * 
          FROM 
            messages 
          WHERE 
            conversation_id = $1
          ORDER BY 
            created_at 
          DESC LIMIT $2 OFFSET $3
        ) 
      AS 
        page 
      ORDER BY 
        created_at 
        ASC
      `,
      [conversationID, limit, offset],
    )
    console.log(rows)
    return rows
  } catch (err) {
    console.error(
      'Error retrieving the chat messages by conversationID: \n' + err.message,
    )
    throw new Error(
      'Error retrieving chat messages by conversationID: \n' + err.message,
    )
  }
}

async function getUserChats(userID) {
  try {
    const { rows } = await pool.query(
      `
        SELECT 
          conversation_participants.conversation_id, 
          conversations.is_group, 
          conversations.name 
        FROM 
          conversation_participants 
        JOIN 
          conversations ON conversations.id = conversation_participants.conversation_id 
        WHERE 
          user_id = $1
        `,
      [userID],
    )

    const chatList = await Promise.all(
      rows.map(async (row) => {
        const participants = await getParticipantsByConversationID(
          row.conversation_id,
        )
        const names = await parseNamesByUserID(participants, userID)
        return { ...row, participants: names }
      }),
    )

    const chatListComplete = await Promise.all(
      chatList.map(async (chat) => {
        if (chat.name || chat.participants.length > 1) {
          return { ...chat, is_read: true }
        } else {
          const id = await getUserIDByUsername(chat.participants[0])

          const { rows } = await pool.query(
            `
            SELECT 
              is_read, created_at 
            FROM 
              messages 
            WHERE 
              conversation_id = $1 
              AND 
              sender_id = $2 
            ORDER BY 
              id 
            DESC LIMIT 1
            `,

            [chat.conversation_id, id],
          )

          const createdAtQuery = await pool.query(
            `
            SELECT 
              created_at 
            FROM 
              messages 
            WHERE 
              conversation_id = $1 
            ORDER BY 
              id 
            DESC LIMIT 1
            `,
            [chat.conversation_id],
          )

          const created_at = createdAtQuery.rows[0]

          if (!rows[0]) {
            return { ...chat, is_read: true, created_at: 0 }
          } else {
            return {
              ...chat,
              is_read: rows[0].is_read,
              created_at: created_at.created_at,
            }
          }
        }
      }),
    )

    return chatListComplete
  } catch (err) {
    console.error('Error retrieving user chats: \n' + err.message)
    throw new Error('Error retrieving user chats: \n' + err.message)
  }
}

async function setIsRead(conversationID, recieverID) {
  try {
    const isTrue = true

    const response = await pool.query(
      `
      UPDATE 
        messages 
      SET 
        is_read=$1 
      WHERE id = ( 
            SELECT id 
            FROM messages 
            WHERE conversation_id=$2 AND sender_id = $3 
            ORDER BY id 
            DESC LIMIT 1)`,
      [isTrue, conversationID, recieverID],
    )
  } catch (err) {
    console.log(
      'There was an error in updating is_read within the database: \n ' +
        err.message,
    )
    throw new Error(
      'There was an error in updating is_read within the database: \n' +
        err.message,
    )
  }
}

async function parseNamesByUserID(participants, userID) {
  try {
    const ids = participants.map((participant) => {
      const id = participant.user_id
      return id
    })
    const filtered = ids.filter((id) => {
      return Number(id) != Number(userID)
    })

    const names = Promise.all(
      filtered.map(async (id) => {
        const { rows } = await pool.query(
          'SELECT users.username FROM users WHERE id=$1',
          [id],
        )
        return rows[0].username
      }),
    )
    return names
  } catch (err) {
    console.log(
      'Error in parsing usernames from websocket data -- parseNamesByUserID \n' +
        err.message,
    )
    throw new Error(
      'Error in parsing usernames from websocket data -- parseNamesByUserID \n' +
        err.message,
    )
  }
}

async function checkDirectMessageConversationExists(userID, profileID) {
  try {
    const { rows } = await pool.query(
      `
      SELECT DISTINCT 
        cp.conversation_id, 
        c.name
      FROM 
        conversation_participants cp
      JOIN 
        conversations c ON cp.conversation_id = c.id
      WHERE 
        cp.conversation_id IN (
          SELECT conversation_id 
          FROM conversation_participants 
          GROUP BY conversation_id 
          HAVING COUNT(*) = 2
        )
        AND cp.conversation_id IN (
          SELECT conversation_id 
          FROM conversation_participants 
          WHERE user_id IN ($1, $2) 
          GROUP BY conversation_id 
          HAVING COUNT(*) = 2
        )
        AND c.name IS NULL
      `,
      [userID, profileID],
    )
    if (rows[0]) {
      const conversation = JSON.stringify(rows[0])
      console.log('Conversation exists: ' + conversation)
      return rows[0].conversation_id
    } else {
      console.log('Attempting to create Conversation: ')
      const { rows } = await pool.query(
        'INSERT INTO conversations DEFAULT VALUES RETURNING id',
      )
      console.log('new conversation: ' + rows[0])
      const conversation_id = rows[0].id
      console.log('conversation id assigned: ' + conversation_id)
      await addParticipant(conversation_id, userID)
      await addParticipant(conversation_id, profileID)

      return conversation_id
    }
  } catch (err) {
    console.log(
      'Error in checking if a DM already exists -- checkDirectMessageConversationExists: \n' +
        err.message,
    )
    throw new Error(
      'Error in checking if a DM already exists -- checkDirectMessageConversationExists: \n' +
        err.message,
    )
  }
}

async function addFriendRequestToDatabase(userID, profileID) {
  try {
    await pool.query(
      'INSERT INTO friend_requests (user_id, request_id, status) VALUES ($1, $2, $3)',
      [userID, profileID, 'pending'],
    )
  } catch (err) {
    return err.message
  }
}

async function getFriendRequests(userID) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM friend_requests WHERE request_id = $1',
      [userID],
    )
    const users = await Promise.all(
      rows.map(async (friendRequest) => {
        const user = await getUserByUserID(friendRequest.user_id)
        const { password, email, is_admin, created_at, ...strippedUser } = user

        return strippedUser
      }),
    )
    return users
  } catch (err) {
    throw new Error(
      'Error when getting friend requests from database \n' + err.message,
    )
  }
}

async function addFriend(userID, requestID) {
  let smaller = null
  let larger = null

  try {
    if (userID < requestID) {
      smaller = userID
      larger = requestID
    } else {
      smaller = requestID
      larger = userID
    }

    await pool.query(
      'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)',
      [smaller, larger],
    )

    await pool.query(
      `
      DELETE FROM 
        friend_requests 
      WHERE 
        (user_id = $1 AND request_id = $2)
      OR 
        (user_id = $2 AND request_id=$1)`,
      [userID, requestID],
    )
  } catch (err) {
    if (err.code === '23505') {
      console.log(
        'Users are already Friends \n UserID1: ' +
          userID +
          '\n UserID2: ' +
          requestID,
      )
      res.status(409).json({ message: 'Users are already Friends' })
    }
    console.log('Error in database query for add friend \n' + err.message)
    throw new Error('Error while adding to database \n' + err.message)
  }
}

async function denyFriend(userID, requestID) {
  try {
    const response = await pool.query(
      'DELETE FROM friend_requests WHERE user_ID=$1 AND request_id=$2',
      [userID, requestID],
    )
  } catch (err) {
    console.log(
      'Error in database query while denying friend request: \n' + err.message,
    )
    throw new Error(
      'There was an error while denying friend request: \n' + err.message,
    )
  }
}

async function removeFriend(userID, friendID) {
  try {
    console.log(userID, friendID)
    let smaller = null
    let larger = null
    if (userID < friendID) {
      smaller = userID
      larger = friendID
    } else {
      smaller = friendID
      larger = userID
    }

    pool.query('DELETE FROM friends WHERE user_id=$1 AND friend_id=$2', [
      smaller,
      larger,
    ])
  } catch (err) {
    throw new Error(
      'Error while removing friend from database: \n' + err.message,
    )
  }
}

async function checkIfFriends(userID, friendID) {
  let smaller = null
  let larger = null

  try {
    if (userID < friendID) {
      smaller = userID
      larger = friendID
    } else {
      smaller = friendID
      larger = userID
    }

    const { rows } = await pool.query(
      'SELECT * FROM friends WHERE user_id=$1 AND friend_id=$2',
      [smaller, larger],
    )
    return rows[0]
  } catch (err) {
    console.log(
      'There was an error in checking friend status in database: \n' +
        err.message,
    )
    throw new Error(
      'There was an error in checking friend status in database \n' +
        err.message,
    )
  }
}

async function getFriends(userID) {
  try {
    const { rows } = await pool.query(
      `(
        SELECT 
          friend_id AS id 
        FROM 
          friends 
        WHERE 
          user_id=$1 
      )

      UNION 
      
      ( 
        SELECT 
          user_id AS id 
        FROM 
          friends 
        WHERE 
          friend_id=$1
      )`,
      [userID],
    )
    const friendsList = rows.map((row) => {
      return row.id
    })

    return friendsList
  } catch (err) {
    console.log(
      'Error in retrieval of user friends during query: \n' + err.message,
    )
    throw new Error(
      'Error in retrieval of user friends during query: \n' + err.message,
    )
  }
}

async function blockUser(userID, blockedID) {
  try {
    pool.query('INSERT INTO blocked (user_id, blocked_id) VALUES ($1, $2)', [
      userID,
      blockedID,
    ])
  } catch (err) {
    console.log(
      'Error within blockUser function in database query: \n' + err.message,
    )
    throw new Error('Error while attempting to block user: \n' + err.message)
  }
}

async function checkIfBlocked(userID, blockedID) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM blocked WHERE user_id=$1 AND blocked_id=$2',
      [userID, blockedID],
    )
    if (rows[0]) {
      return true
    } else {
      return false
    }
  } catch (err) {
    console.log('Error in checking the database: \n' + err.message)
    throw new Error('Error checking database: \n' + err.message)
  }
}

async function unblockUser(userID, unblockedID) {
  try {
    await pool.query('DELETE FROM blocked WHERE user_id=$1 AND blocked_id=$2', [
      userID,
      unblockedID,
    ])
  } catch (err) {
    console.log('Error in unblocking user within query: \n' + err.message)
    throw new Error('Error in unblocking user: \n' + err.message)
  }
}

async function checkIfPublic(userID) {
  try {
    const { rows } = await pool.query(
      'SELECT is_public FROM users WHERE id=$1',
      [userID],
    )
    const isPublic = rows[0].is_public
    return isPublic
  } catch (err) {
    throw new Error(
      'There was a problem in checking database for profile status: \n' +
        err.message,
    )
  }
}

async function changeProfileStatus(userID, status) {
  try {
    if (status) {
      const response = await pool.query(
        'UPDATE users SET is_public = FALSE WHERE id=$1 RETURNING *',
        [userID],
      )
      return response
    } else {
      const response = await pool.query(
        'UPDATE users SET is_public = TRUE WHERE id=$1 RETURNING *',
        [userID],
      )
      return response
    }
  } catch (err) {
    throw new Error(
      'There was a problem changing profile status within database: \n' +
        err.message,
    )
  }
}

async function addProfilePictureURL(key, userID) {
  try {
    const { rows } = await pool.query(
      'UPDATE users SET profile_picture=$1 WHERE id=$2 RETURNING *',
      [key, userID],
    )
    return {
      message: 'Profile Picture Successfully uploaded',
      url: rows[0].profile_picture,
    }
  } catch (err) {
    console.log(
      'Error within Database adding profile picture: \n' + err.message,
    )
    throw new Error(
      'Error adding to database profile picture: \n' + err.message,
    )
  }
}

async function getProfilePictureURL(userID) {
  try {
    const { rows } = await pool.query(
      'SELECT profile_picture FROM users WHERE id = $1',
      [userID],
    )
    if (rows[0]) {
      return rows[0]
    } else {
      return null
    }
  } catch (err) {
    console.log(
      'There was an error in retrieving the profile picture url from the database: \n' +
        err.message,
    )
    throw new Error(
      'There was an error in retrieving the profile picture url from the database: \n' +
        err.message,
    )
  }
}

async function getProfilePictureURLByUserName(userName) {
  try {
    const { rows } = await pool.query(
      'SELECT profile_picture FROM users WHERE username=$1',
      [userName],
    )
    return rows[0].profile_picture
  } catch (err) {
    console.log(
      'There was an error in retrieving the profile picture by user name: \n' +
        err.message,
    )
    throw new Error(
      'There was an error in retrieving the profile picture by user name: \n' +
        err.message,
    )
  }
}

async function editAboutMe(aboutMe, userID) {
  try {
    const { rows } = await pool.query(
      'UPDATE users SET about_me=$1 WHERE id=$2 RETURNING *',
      [aboutMe, userID],
    )
    return rows[0]
  } catch (err) {
    console.log(
      'There was an error updating user about me in database: \n' + err.message,
    )
    throw new Error(
      '\n There was an error updating user about me in database: \n' +
        err.message,
    )
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
  addFriendRequestToDatabase,
  getFriendRequests,
  addFriend,
  denyFriend,
  checkIfFriends,
  getFriends,
  removeFriend,
  blockUser,
  unblockUser,
  checkIfBlocked,
  checkIfPublic,
  changeProfileStatus,
  addProfilePictureURL,
  getProfilePictureURL,
  getProfilePictureURLByUserName,
  editAboutMe,
  setIsRead,
  checkEmailExists,
  checkUsernameExists,
  addUserOAuth,
}
