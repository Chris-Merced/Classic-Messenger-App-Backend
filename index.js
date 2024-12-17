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

//http server to use express routing
const server = http.createServer(app);
//Set websocket to listen in on http server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("New Data Flow");

  ws.on("message", (message) => {
    db.addMessageToConversations(message.toString());

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
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
