const Express = require("express");
const app = Express();
const db = require("./db/queries");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const cron = require("node-cron");
const WebSocket = require("ws");
const http = require("http");
const { cleanupSchedule } = require("./db/queries");
const loginRouter = require("./routers/loginRouter");
const logoutRouter = require("./routers/logoutRouter");
const signupRouter = require("./routers/signuprouter");
const conversationRouter = require("./routers/conversationRouter");
const userProfileRouter = require("./routers/userProfileRouter");
const messagesRouter = require("./routers/messagesRouter");
const rateLimit = require("express-rate-limit");
const { createClient } = require("redis");
//MAIN CHAT NOW AT NEAR FULL FUNCTIONALITY BY POPULATING THE
//CHAT ON PAGE LOAD WITH PREVIOUS MESSAGES FROM DB

//NEXT IDEA IS TO ADD DIRECT MESSAGE FUNCTIONALITY
//AFTER THAT WE SEE IF WE CAN ADD THE ABILITY TO CREATE PUBLIC CHAT SPACES

const currentServerId = process.env.DYNO || "local-server";

const redisPublisher = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

const redisSubscriber = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisPublisher.on("Error: ", (err) => console.error("Redis Publisher Error:", err));
redisSubscriber.on("Error: ", (err) => console.error("Redis Subscriber Error:", err));

async function connectToRedis() {
  try {
    await redisPublisher.connect();
    await redisSubscriber.connect();
    console.log("Redis connected successfully");

    await redisSubscriber.subscribe("chatMessages", (message) => {
      try {
        const messageData = JSON.parse(message);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(messageData));
          }
        });
      } catch (error) {
        console.error("Error processing Redis message:", error);
      }
    });
  } catch (error) {
    console.error("Redis connection error:", error);
    setTimeout(connectToRedis, 5000);
  }
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 9001,
  message: "Too Many Requests, please try again later.",
});

//Database Query to clean up expired sessions
global.cleanupTask = cron.schedule("* * * * *", cleanupSchedule);

//Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "http://localhost:9000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(Express.json());
app.use("/", limiter);

//Routers
app.use("/login", loginRouter);
app.use("/logout", logoutRouter);
app.use("/signup", signupRouter);
app.use("/userProfile", userProfileRouter);
app.use("/messages", messagesRouter);
app.use("/conversations", conversationRouter);

//http server to use express routing
const server = http.createServer(app);
//Set websocket to listen in on http server
const wss = new WebSocket.Server({ noServer: true });

server.on("upgrade", async (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

const activeUsers = {};

wss.on("connection", (ws, req) => {
  console.log("New Data Flow");
  let userIdentifier = null;

  ws.on("message", async (message) => {
    var usersResponse;
    console.log("Message: " + message)
    const data = message.toString();
    console.log("data: " + data)
    const info = JSON.parse(data);
    console.log("info: " + info);
    console.log("Recieved");
    if (!info.registration) {
      console.log(info.reciever);
      if (info.reciever){
        usersResponse = await Promise.all(info.reciever.map(async (username)=>{
        const user = await redisPublisher.hGet("activeUsers", username);
        const parsedUser = JSON.parse(user);
        

        return completeUser = {...parsedUser, username}
        }))
      
      
      }
      //const recipients = JSON.stringify(responseUsers);
      //YOU NOW HAVE AN ARRAY OF THE RECIPIENTS SERVER VALUES

      //FOR EACH recipient IN recipients
      //IF
      //SERVER ID IS THE SAME
      //THEN CHECK LOCAL ACTIVE USERS KEY-VALUE PAIR TO GET WEBSOCKET AND SEND MESSAGE
      //ELSE
      //SEND MESSAGE TO APPROPRIATE SERVER WITHIN recipient TO HANDLE

      console.log("Mapping Reciever results: " + JSON.stringify(usersResponse));
      
      
      //IF CHAT NAME EXISTS CHECK NAME
      //IF DM SEND VIA DM USING RECIPIENT AND SENDER VARIABLES

      await redisPublisher.publish("chatMessages", message.toString());
    } else {
      const cookieStr = req.headers.cookie;
      if (cookieStr) {
        const sessionTokenStr = cookieStr.split("=")[1];
        const decodedSession = decodeURIComponent(sessionTokenStr);
        const sessionObj = JSON.parse(decodedSession);
        const data = await db.getUserBySession(sessionObj.sessionID);
        if (data) {
          userIdentifier = data.username;

          await redisPublisher.hSet(
            "activeUsers",
            data.username,
            JSON.stringify({
              serverID: currentServerId,
              lastSeen: Date.now(),
            })
          );

          activeUsers[data.username] = {
            ws: ws,
            lastActive: Date.now(),
          };
          console.log(activeUsers);
        }
      }
    }
  });

  ws.on("close", async () => {
    try {
      if (userIdentifier) {
        //await redisPublisher.hDel("activeUsers", userIdentifier);
        //delete activeUsers[userIdentifier];
        console.log(`User ${userIdentifier} disconnected from ${currentServerId}`);
      }
    } catch (error) {
      console.error("Error handling WebSocket close:", error);
    }
  });

  ws.on("error", (error) => {
    console.error("Websocket Backend Error:", error);
  });
});

connectToRedis();

async function cleanup() {
  try {
    wss.clients.forEach((client) => {
      client.close();
    });

    await redisPublisher.quit();
    await redisSubscriber.quit();

    server.close(() => {
      console.log("HTTP server closed");
    });

    console.log("Cleanup completed");
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = server;
