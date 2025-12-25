"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db = __importStar(require("./src/db/queries"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const ws_1 = require("ws");
const cleanupTask_1 = require("./src/utils/cleanupTask");
const http_1 = __importDefault(require("http"));
const loginRouter_1 = __importDefault(require("./src/routers/loginRouter"));
const logoutRouter_1 = __importDefault(require("./src/routers/logoutRouter"));
const signupRouter_1 = __importDefault(require("./src/routers/signupRouter"));
const conversationRouter_1 = __importDefault(require("./src/routers/conversationRouter"));
const userProfileRouter_1 = __importDefault(require("./src/routers/userProfileRouter"));
const messagesRouter_1 = __importDefault(require("./src/routers/messagesRouter"));
const oauthRouter_1 = __importDefault(require("./src/routers/oauthRouter"));
const adminRouter_1 = __importDefault(require("./src/routers/adminRouter"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const redisClient_1 = require("./src/redisClient");
const app = (0, express_1.default)();
//ID for redis tracking
const currentServerId = process.env.DYNO || "local-server";
(0, redisClient_1.connectToRedis)();
/* TODO:
  Clean up imports within index.ts
  Remove all old js files within controllers, routers, queriesOld.js,
    authentication.js, indexOld.js, and redisClient.js. Verify each of
    these files are not being used by a typeScript file before deletion
  Default profile pictures are not showing up appropriately within DMs
*/
async function setUpMessageSubscriber() {
    try {
        await redisClient_1.redisSubscriber.subscribe("chatMessages", (message) => {
            const messageData = JSON.parse(message);
            if (messageData.reciever) {
                messageData.reciever.forEach(async (reciever) => {
                    const userGET = await redisClient_1.redisPublisher.hGet("activeUsers", reciever);
                    if (!userGET) {
                        throw new Error("Failed to retrieve user information from chat Message Pub/Sub");
                    }
                    const user = JSON.parse(userGET);
                    if (user &&
                        user.serverID === currentServerId &&
                        activeUsers[reciever]) {
                        let userInformation = activeUsers[reciever];
                        userInformation.ws.send(JSON.stringify(messageData));
                    }
                });
            }
        });
    }
    catch (error) {
        console.error("Redis connection error:", error);
        //more robust error handling can exist here by implementing return
        //   value that indicates connection, set timeout in while loop
        //    until connection is confirmed
        setTimeout(redisClient_1.connectToRedis, 5000);
    }
}
async function setUpFriendRequestSubscriber() {
    try {
        await redisClient_1.redisSubscriber.subscribe("friendRequests", (request) => {
            try {
                const requestData = JSON.parse(request);
                if (requestData.reciever) {
                    requestData.reciever.forEach(async (reciever) => {
                        const userGET = await redisClient_1.redisPublisher.hGet("activeUsers", reciever);
                        if (!userGET) {
                            throw new Error("Failed to retrieve user information from Friend Request Pub/Sub");
                        }
                        const user = JSON.parse(userGET);
                        if (user &&
                            user.serverID === currentServerId &&
                            activeUsers[reciever]) {
                            let userInformation = activeUsers[reciever];
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
        setTimeout(redisClient_1.connectToRedis, 5000);
    }
}
setUpMessageSubscriber();
setUpFriendRequestSubscriber();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 9001,
    message: "Too Many Requests, please try again later.",
});
//Begin task scheduler that cleans up expired sessions
(0, cleanupTask_1.sessionCleanup)();
//Middleware
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:9000",
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use("/", limiter);
//Routers
app.use("/login", loginRouter_1.default);
app.use("/logout", logoutRouter_1.default);
app.use("/signup", signupRouter_1.default);
app.use("/userProfile", userProfileRouter_1.default);
app.use("/messages", messagesRouter_1.default);
app.use("/conversations", conversationRouter_1.default);
app.use("/oauth", oauthRouter_1.default);
app.use("/admin", adminRouter_1.default);
app.get("/loaderio-363f93789958f968a3e18e63bd2ecfb0.txt", (req, res) => {
    console.log("made it loaderio verification");
    res.type("text/plain");
    res.send("loaderio-363f93789958f968a3e18e63bd2ecfb0");
});
//http server to use express routing
const server = http_1.default.createServer(app);
//Set http server to send request object through to websocket on connection upgrade
const wss = new ws_1.WebSocket.Server({ noServer: true });
server.on("upgrade", async (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
    });
});
//Keeps track of all users with verified sessions
const activeUsers = {};
const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        const socket = ws;
        if (socket.isAlive === false) {
            console.log("Terminating stale connection");
            return ws.terminate();
        }
        socket.isAlive = false;
        ws.ping();
    });
}, 20000);
wss.on("connection", (ws, req) => {
    console.log("New Data Flow");
    let userIdentifier = null;
    const socket = ws;
    socket.isAlive = true;
    ws.on("pong", () => {
        socket.isAlive = true;
    });
    ws.on("message", async (message) => {
        var recipients;
        console.log("made it to websocket OnMessage");
        const data = message.toString();
        const info = JSON.parse(data);
        if (!info.registration && info.type !== "test") {
            if (info.reciever) {
                recipients = await Promise.all(info.reciever.map(async (username) => {
                    const user = await redisClient_1.redisPublisher.hGet("activeUsers", username);
                    if (!user) {
                        throw new Error("Failed to Retrieve user from activeUsers redis hashtable");
                    }
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
                                await redisClient_1.redisPublisher.publish("chatMessages", JSON.stringify({ ...info, reciever: [recipient.username] }));
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
                                await redisClient_1.redisPublisher.publish("friendRequests", JSON.stringify({ ...info, reciever: [recipient.username] }));
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
            await redisClient_1.redisPublisher.hSet("activeUsers", testUsername, JSON.stringify({
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
                        await redisClient_1.redisPublisher.hSet("activeUsers", data.username, JSON.stringify({
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
                await redisClient_1.redisPublisher.hDel("activeUsers", userIdentifier);
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
        await redisClient_1.redisPublisher.quit();
        await redisClient_1.redisSubscriber.quit();
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
module.exports = { server, redisPublisher: redisClient_1.redisPublisher, redisSubscriber: redisClient_1.redisSubscriber };
//# sourceMappingURL=index.js.map