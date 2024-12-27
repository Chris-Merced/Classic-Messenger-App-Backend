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

//MAIN CHAT NOW AT NEAR FULL FUNCTIONALITY BY POPULATING THE
//CHAT ON PAGE LOAD WITH PREVIOUS MESSAGES FROM DB

//NEXT IDEA IS TO ADD DIRECT MESSAGE FUNCTIONALITY
//AFTER THAT WE SEE IF WE CAN ADD THE ABILITY TO CREATE PUBLIC CHAT SPACES

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 9001,
  message: "Too Many Requedsts, please try again later.",
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

  ws.on("message", async (message) => {
    
    const data = (message.toString());
    const info = JSON.parse(data);
    console.log("Recieved");
    if (!info.registration) {
      db.addMessageToConversations(message.toString());

      //CHECK THE MESSAGE JSON FOR TYPE OF MESSAGE
      //IF REGISTRATION ADD TO DICT
      //IF CHAT NAME EXISTS CHECK NAME
      //IF DM SEND VIA DM USING RECIPIENT AND SENDER VARIABLES

    

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          console.log(message.toString());
          client.send(message.toString());
              console.log("Message sent to client");
        }
      });
    } else {
      const cookieStr = req.headers.cookie; 
      if (cookieStr) {
        const sessionTokenStr = cookieStr.split("=")[1]; 
        const decodedSession = decodeURIComponent(sessionTokenStr); 
        const sessionObj = JSON.parse(decodedSession); 
        const data = await db.getUserBySession(sessionObj.sessionID);
        if (data) {
          activeUsers[data.username] = ws;
        }
        console.log(activeUsers);
      }
      
    }
  });

  ws.on("close", () => {
    console.log("Client Disconnected");
  });

  ws.on("error", (error) => {
    console.error("Websocket Backend Error:", error);
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = server;
