const Express = require('express')
const app = Express()
const db = require('./db/queries')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const cron = require('node-cron')
const WebSocket = require('ws')
const http = require('http')
const { cleanupSchedule } = require('./db/queries')
const loginRouter = require('./routers/loginRouter')
const logoutRouter = require('./routers/logoutRouter')
const signupRouter = require('./routers/signuprouter')
const conversationRouter = require('./routers/conversationRouter')
const userProfileRouter = require('./routers/userProfileRouter')
const messagesRouter = require('./routers/messagesRouter')
const rateLimit = require('express-rate-limit')
const { createClient } = require('redis')
const {
  redisPublisher,
  redisSubscriber,
  connectToRedis,
} = require('./redisClient')

//THINK ABOUT CREATING A FRIEND FUNCTIONALITY FOR PRIVATE AND PUBLIC DMS

//Keep track of the current server for websocket verification
const currentServerId = process.env.DYNO || 'local-server'

connectToRedis()

async function setUpSubscriber() {
  try {
    await redisSubscriber.subscribe('chatMessages', (message) => {
      try {
        const messageData = message
        if (messageData.reciever) {
          messageData.reciever.forEach(async (reciever) => {
            const userGET = await redisPublisher.hGet('activeUsers', reciever)
            const user = { reciever, userGET }
            if (user.serverID !== null && user.serverID === currentServerId) {
              userInformation = activeUsers[reciever]
              userInformation.ws.send(message.toString())
            }
          })
        } else {
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(messageData))
            }
          })
        }
      } catch (error) {
        console.error('Error processing Redis message:', error)
      }
    })
  } catch (error) {
    console.error('Redis connection error:', error)
    setTimeout(connectToRedis, 5000)
  }
}

setUpSubscriber()

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 9001,
  message: 'Too Many Requests, please try again later.',
})

//Database Query to clean up expired sessions
global.cleanupTask = cron.schedule('* * * * *', cleanupSchedule)

//Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:9000',
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(Express.json())
app.use('/', limiter)

//Routers
app.use('/login', loginRouter)
app.use('/logout', logoutRouter)
app.use('/signup', signupRouter)
app.use('/userProfile', userProfileRouter)
app.use('/messages', messagesRouter)
app.use('/conversations', conversationRouter)

//http server to use express routing
const server = http.createServer(app)
//Set websocket to listen in on http server
const wss = new WebSocket.Server({ noServer: true })
server.on('upgrade', async (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request)
  })
})

const activeUsers = {}

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      console.log('Terminating stale connection')
      return ws.terminate()
    }
    ws.isAlive = false 
    ws.ping() 
  })
}, 20000)

wss.on('connection', (ws, req) => {
  console.log('New Data Flow')
  let userIdentifier = null

  ws.isAlive = true

  ws.on('pong', () => {
    ws.isAlive = true
  })

  ws.on('message', async (message) => {
    var recipients
    console.log('made it to websocket OnMessage')
    const data = message.toString()
    const info = JSON.parse(data)
    if (!info.registration) {
      if (info.reciever) {
        recipients = await Promise.all(
          info.reciever.map(async (username) => {
            const user = await redisPublisher.hGet('activeUsers', username)
            const parsedUser = JSON.parse(user)

            return (completeUser = { ...parsedUser, username })
          }),
        )
      }
      if (recipients) {
        console.log(info)
        recipients.forEach(async (recipient) => {
          const userID = recipient.username
          const blockedUserID = info.userID
          const { id } = await db.getUserByUsername(userID)
          const isBlocked = await db.checkIfBlocked(id, blockedUserID)
          if (!isBlocked) {
            if (recipient.serverID === currentServerId) {
              const userData = activeUsers[recipient.username]
              if (userData) {
                userData.ws.send(message.toString())
              }
              return
            } else {
              await redisPublisher.publish(
                'chatMessages',
                { ...message, receiver: [recipient.username] }.toString(),
              )
            }
          } else {
            return
          }
        })
        return
      }

      await redisPublisher.publish('chatMessages', message.toString())
    } else {
      console.log('made it to user registration to active users')
      const cookieStr = req.headers.cookie
      if (cookieStr) {
        const sessionTokenStr = cookieStr.split('=')[1]
        const decodedSession = decodeURIComponent(sessionTokenStr)
        const sessionObj = JSON.parse(decodedSession)
        const data = await db.getUserBySession(sessionObj.sessionID)
        if (data) {
          console.log('made it to data exists for: ')
          console.log(data.username)
          userIdentifier = data.username

          await redisPublisher.hSet(
            'activeUsers',
            data.username,
            JSON.stringify({
              serverID: currentServerId,
              lastSeen: Date.now(),
            }),
          )

          activeUsers[data.username] = {
            ws: ws,
            lastActive: Date.now(),
          }
        }
      }
    }
  })

  ws.on('close', async () => {
    try {
      if (userIdentifier) {
        await redisPublisher.hDel('activeUsers', userIdentifier)
        delete activeUsers[userIdentifier]
        console.log(
          `User ${userIdentifier} disconnected from ${currentServerId}`,
        )
      }
    } catch (error) {
      console.error('Error handling WebSocket close:', error)
    }
  })

  ws.on('error', (error) => {
    console.error('Websocket Backend Error:', error)
  })
})

async function cleanup() {
  try {
    wss.clients.forEach((client) => {
      client.close()
    })

    await redisPublisher.quit()
    await redisSubscriber.quit()

    server.close(() => {
      console.log('HTTP server closed')
    })

    console.log('Cleanup completed')
  } catch (error) {
    console.error('Error during cleanup:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => {
  clearInterval(interval)
  cleanup()
})
process.on('SIGINT', () => {
  clearInterval(interval)
  cleanup()
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`))

module.exports = { server, redisPublisher, redisSubscriber }
