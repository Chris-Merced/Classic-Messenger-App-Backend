const { createClient } = require('redis');

const redisPublisher = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

const redisSubscriber = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisPublisher.on('error', (err) => console.error('Redis Publisher Error:', err));
redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

async function connectToRedis() {
  await redisPublisher.connect();
  await redisSubscriber.connect();
  console.log('Redis connected successfully');
}

module.exports = { redisPublisher, redisSubscriber, connectToRedis };

