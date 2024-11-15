
const Express = require('express');
const app = Express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const WebSocket = require('ws');
const http = require('http')
const { cleanupSchedule } = require('./db/queries');
const loginRouter = require("./routers/loginRouter");
const signupRouter = require("./routers/signuprouter");
const userProfileRouter = require('./routers/userProfileRouter');

//Cron to clean up expired sessions
cron.schedule('* * * * *', cleanupSchedule);


//Middleware
app.use(cors({
    origin: 'http://localhost:9000',
    credentials: true
}))
app.use(cookieParser());
app.use(Express.json());


//Routers
app.use("/login", loginRouter);
app.use("/signup", signupRouter);
app.use("/userProfile", userProfileRouter);


//Ensure Websocket and Express app are listening in on the same server port
const server = http.createServer(app);
const wss = new WebSocket.Server({ server })

wss.on("connection", (ws) => {
    console.log('New Data Flow');

    ws.on('message', (message) => {
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

