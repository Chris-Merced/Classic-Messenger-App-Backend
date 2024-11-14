
const Express = require('express');
const app = Express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const WebSocket = require('ws');
const http = require('http')
const loginRouter = require("./routers/loginRouter");
const signupRouter = require("./routers/signuprouter");
const userProfileRouter = require('./routers/userProfileRouter');


app.use(cookieParser());
app.use(Express.json());


app.use(cors({
    origin: 'http://localhost:9000',
    credentials: true
}))


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



app.use("/login", loginRouter);
app.use("/signup", signupRouter);
app.use("/userProfile", userProfileRouter);
server.listen(3000, console.log("We're Listening"));

