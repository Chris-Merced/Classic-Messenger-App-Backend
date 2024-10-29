///Just created the signup route with the users table in the classic messenger database
//now need to create the front end signup portion to connect and add to database through
//front end
//
//after connection to the frontend is established we can start sanitizing and encrypting



const Express = require("express");
const app = Express();
const WebSocket = require('ws');
const http = require('http')
const loginRouter = require("./routers/loginRouter");
const signupRouter = require("./routers/signuprouter");


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


app.use(Express.json());
app.use("/login", loginRouter);
app.use("/signup", signupRouter);
server.listen(3000, console.log("We're Listening"));

