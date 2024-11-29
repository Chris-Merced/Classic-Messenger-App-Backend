
const Express = require('express');
const app = Express();
const db = require('./db/queries');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const WebSocket = require('ws');
const http = require('http')
const { cleanupSchedule } = require('./db/queries');
const loginRouter = require("./routers/loginRouter");
const logoutRouter = require("./routers/logoutRouter");
const signupRouter = require("./routers/signuprouter");
const userProfileRouter = require('./routers/userProfileRouter');
const rateLimit = require('express-rate-limit');


//DATABASE WORKING ON MAIN CHAT FUNCTIONALITY
//YOU HAVE ADDED THE FUNCTIONALITY TO ADD MESSAGES TO DATABASE FROM MAIN CHAT
//IF THE MAIN CHAT DOES NOT EXIST YET
//YOU NOW NEED TO ADD THE FUNCTIONALITY FOR WHEN THE MAIN CHAT DOES EXIST
//GO TO QUERIES.JS AND CHECK COMMENTS AT TOP


//Define the rate limits
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 9001,
    message: 'Too Many Requedsts, please try again later.'
})


//Database Query to clean up expired sessions
cron.schedule('* * * * *', cleanupSchedule);


//Middleware
app.use(cors({
    origin: 'http://localhost:9000',
    credentials: true
}))
app.use(cookieParser());
app.use(Express.json());
app.use('/', limiter);

//Routers
app.use("/login", loginRouter);
app.use("/logout", logoutRouter);
app.use("/signup", signupRouter);
app.use("/userProfile", userProfileRouter);


//Ensure Websocket and Express app are listening in on the same server port
const server = http.createServer(app);
const wss = new WebSocket.Server({ server })

wss.on("connection", (ws) => {
    console.log('New Data Flow');

    ws.on('message', (message) => {
        console.log(message.toString());
        db.addMessageToConversations(message.toString());

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) { client.send(message.toString()); }  
        })
    })

    ws.on('close', () => {
        console.log("Client Disconnected");
    })

    ws.on('error', (error) => {
        console.error("Websocket Backend Error:", error)
    });
})

//Start Server
server.listen(3000, console.log("We're Listening"));

