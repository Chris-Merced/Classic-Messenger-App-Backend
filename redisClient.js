const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const isProduction = process.env.NODE_ENV === 'production';
const clientOptions = isProduction
  ? { url: redisUrl, tls: { rejectUnauthorized: true } } 
  : { url: redisUrl }; 

const redisPublisher = createClient(clientOptions);
const redisSubscriber = createClient(clientOptions);

redisPublisher.on('error', (err) => console.error('Redis Publisher Error:', err));
redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

async function connectToRedis() {
  await redisPublisher.connect();
  await redisSubscriber.connect();
  console.log('Redis connected successfully');
}

module.exports = { redisPublisher, redisSubscriber, connectToRedis };

