"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisSubscriber = exports.redisPublisher = void 0;
const redis_1 = require("redis");
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isProduction = process.env.NODE_ENV === 'production';
const clientOptions = isProduction
    ? {
        url: redisUrl,
        socket: {
            tls: true,
            rejectUnauthorized: false
        }
    }
    : { url: redisUrl };
exports.redisPublisher = (0, redis_1.createClient)(clientOptions);
exports.redisSubscriber = (0, redis_1.createClient)(clientOptions);
exports.redisPublisher.on('error', (err) => {
    if (err.code !== 'SELF_SIGNED_CERT_IN_CHAIN') {
        console.error('Redis Publisher Error:', err);
    }
});
exports.redisSubscriber.on('error', (err) => {
    if (err.code !== 'SELF_SIGNED_CERT_IN_CHAIN') {
        console.error('Redis Subscriber Error:', err);
    }
});
async function connectToRedis() {
    await exports.redisPublisher.connect();
    await exports.redisSubscriber.connect();
    console.log('Redis connected successfully');
}
exports.default = { redisPublisher: exports.redisPublisher, redisSubscriber: exports.redisSubscriber, connectToRedis };
//# sourceMappingURL=redisClient.js.map