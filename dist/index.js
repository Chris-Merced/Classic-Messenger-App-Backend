"use strict";
const Express = require("express");
const app = Express();
const db = require("./src/db/queries");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const cron = require("node-cron");
const WebSocket = require("ws");
const http = require("http");
const { cleanupSchedule } = require("./src/db/queries");
const loginRouter = require("./src/routers/loginRouter").default;
const logoutRouter = require("./src/routers/logoutRouter").default;
const signupRouter = require("./src/routers/signuprouter").default;
const conversationRouter = require("./src/routers/conversationRouter").default;
const userProfileRouter = require("./src/routers/userProfileRouter").default;
const messagesRouter = require("./src/routers/messagesRouter").default;
const oauthRouter = require("./src/routers/oauthRouter").default;
const adminRouter = require("./src/routers/adminRouter").default;
const rateLimit = require("express-rate-limit");
const { createClient } = require("redis");
const { redisPublisher, redisSubscriber, connectToRedis, } = require("./src/redisClient").default;
//ID for redis tracking
const currentServerId = process.env.DYNO || "local-server";
connectToRedis();
async function setUpMessageSubscriber() {
    try {
        await redisSubscriber.subscribe("chatMessages", (message) => {
            try {
                const messageData = JSON.parse(message);
                if (messageData.reciever) {
                    messageData.reciever.forEach(async (reciever) => {
                        const userGET = await redisPublisher.hGet("activeUsers", reciever);
                        const user = JSON.parse(userGET);
                        if (user &&
                            user.serverID === currentServerId &&
                            activeUsers[reciever]) {
                            userInformation = activeUsers[reciever];
                            userInformation.ws.send(JSON.stringify(messageData));
                        }
                    });
                }
            }
            catch (error) {
                console.error("Error processing Redis message:", error);
            }
        });
    }
    catch (error) {
        console.error("Redis connection error:", error);
        setTimeout(connectToRedis, 5000);
    }
}
async function setUpFriendRequestSubscriber() {
    try {
        await redisSubscriber.subscribe("friendRequests", (request) => {
            try {
                const requestData = JSON.parse(request);
                if (requestData.reciever) {
                    requestData.reciever.forEach(async (reciever) => {
                        const userGET = await redisPublisher.hGet("activeUsers", reciever);
                        const user = JSON.parse(userGET);
                        if (user &&
                            user.serverID === currentServerId &&
                            activeUsers[reciever]) {
                            userInformation = activeUsers[reciever];
                            userInformation.ws.send(JSON.stringify(requestData));
                        }
                    });
                }
            }
            catch (error) {
                console.error("Error processing Redis message:", error);
            }
        });
    }
    catch (error) {
        console.error("Redis connection error:", error);
        setTimeout(connectToRedis, 5000);
    }
}
setUpMessageSubscriber();
setUpFriendRequestSubscriber();
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 9001,
    message: "Too Many Requests, please try again later.",
});
//Database Query to clean up expired sessions
global.cleanupTask = cron.schedule("* * * * *", cleanupSchedule);
//Middleware
app.use(cors({
    origin: process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:9000",
    credentials: true,
}));
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
app.use("/oauth", oauthRouter);
app.use("/admin", adminRouter);
app.get("/loaderio-363f93789958f968a3e18e63bd2ecfb0.txt", (req, res) => {
    console.log("made it loaderio verification");
    res.type("text/plain");
    res.send("loaderio-363f93789958f968a3e18e63bd2ecfb0");
});
//http server to use express routing
const server = http.createServer(app);
//Set http server to send request object through to websocket on connection upgrade
const wss = new WebSocket.Server({ noServer: true });
server.on("upgrade", async (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
    });
});
//Keeps track of all users with verified sessions
const activeUsers = {};
const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
            console.log("Terminating stale connection");
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 20000);
wss.on("connection", (ws, req) => {
    console.log("New Data Flow");
    let userIdentifier = null;
    ws.isAlive = true;
    ws.on("pong", () => {
        ws.isAlive = true;
    });
    ws.on("message", async (message) => {
        var recipients;
        console.log("made it to websocket OnMessage");
        const data = message.toString();
        const info = JSON.parse(data);
        if (!info.registration && info.type !== "test") {
            if (info.reciever) {
                recipients = await Promise.all(info.reciever.map(async (username) => {
                    const user = await redisPublisher.hGet("activeUsers", username);
                    const parsedUser = JSON.parse(user);
                    let completeUser = {};
                    return (completeUser = { ...parsedUser, username });
                }));
            }
            if (recipients) {
                recipients.forEach(async (recipient) => {
                    const userID = recipient.username;
                    const blockedUserID = info.userID;
                    const { id } = await db.getUserByUsername(userID);
                    const isBlocked = await db.checkIfBlocked(id, blockedUserID);
                    if (!isBlocked) {
                        if (info.type === "message") {
                            if (recipient.serverID === currentServerId) {
                                const userData = activeUsers[recipient.username];
                                if (userData) {
                                    userData.ws.send(JSON.stringify(info));
                                }
                                return;
                            }
                            else {
                                await redisPublisher.publish("chatMessages", JSON.stringify({ ...info, reciever: [recipient.username] }));
                            }
                        }
                        else if (info.type === "friendRequest") {
                            console.log("we seem to have made it so far");
                            console.log(recipient);
                            console.log(id);
                            if (recipient.serverID === currentServerId) {
                                const userData = activeUsers[recipient.username];
                                if (userData) {
                                    userData.ws.send(JSON.stringify(info));
                                }
                                return;
                            }
                            else {
                                await redisPublisher.publish("friendRequests", JSON.stringify({ ...info, reciever: [recipient.username] }));
                            }
                            return;
                        }
                    }
                    else {
                        return;
                    }
                });
                return;
            }
        }
        else if (info.type === "test") {
            const testUsername = `testuser_${info.clientId || Math.random()}`;
            userIdentifier = testUsername;
            await redisPublisher.hSet("activeUsers", testUsername, JSON.stringify({
                serverID: currentServerId,
                lastSeen: Date.now(),
            }));
            activeUsers[testUsername] = {
                ws: ws,
                lastActive: Date.now(),
            };
            console.log(`Test user ${testUsername} stored in Redis and memory`);
            ws.send(JSON.stringify({
                type: "test_echo",
                stored: true,
                username: testUsername,
                messageId: info.messageId,
                timestamp: Date.now(),
            }));
        }
        else if (info.registration) {
            const cookieStr = req.headers.cookie;
            if (cookieStr) {
                const cookies = {};
                cookieStr.split(";").forEach((cookie) => {
                    const [name, ...rest] = cookie.trim().split("=");
                    cookies[name] = decodeURIComponent(rest.join("="));
                });
                if (cookies.sessionToken) {
                    const decodedSession = decodeURIComponent(cookies.sessionToken);
                    const sessionObj = JSON.parse(decodedSession);
                    const data = await db.getUserBySession(sessionObj.sessionID);
                    if (data) {
                        console.log("made it to data exists for: ");
                        console.log(data.username);
                        userIdentifier = data.username;
                        await redisPublisher.hSet("activeUsers", data.username, JSON.stringify({
                            serverID: currentServerId,
                            lastSeen: Date.now(),
                        }));
                        activeUsers[data.username] = {
                            ws: ws,
                            lastActive: Date.now(),
                        };
                    }
                }
            }
        }
    });
    ws.on("close", async () => {
        try {
            if (userIdentifier) {
                await redisPublisher.hDel("activeUsers", userIdentifier);
                delete activeUsers[userIdentifier];
                console.log(`User ${userIdentifier} disconnected from ${currentServerId}`);
            }
        }
        catch (error) {
            console.error("Error handling WebSocket close:", error);
        }
    });
    ws.on("error", (error) => {
        console.error("Websocket Backend Error:", error);
    });
});
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
    }
    catch (error) {
        console.error("Error during cleanup:", error);
        process.exit(1);
    }
}
process.on("SIGTERM", () => {
    clearInterval(interval);
    cleanup();
});
process.on("SIGINT", () => {
    clearInterval(interval);
    cleanup();
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
module.exports = { server, redisPublisher, redisSubscriber };
//# sourceMappingURL=index.js.map