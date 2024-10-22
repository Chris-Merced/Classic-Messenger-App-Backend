const Express = require("express");
const app = Express();
const WebSocket = require('ws');
const http = require('http')
const loginRouter = require("./routers/loginRouter");


//Ensure Websocket and Express app are listening in on the same server port
const server = http.createServer(app);
const wss = new WebSocket.Server({ server })

wss.on("connection", (ws) => {
    console.log('New Data Flow');

    ws.on('message', (message) => {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) { client.send(message); }  
        })
    })

    ws.on('close', () => {
        console.log("Client Disconnected");
    })
})


app.use(Express.json());
app.use("/login", loginRouter);

server.listen(3000, console.log("We're Listening"));

