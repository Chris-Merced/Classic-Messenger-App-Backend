import { createClient } from 'redis'

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

export const redisPublisher = createClient(clientOptions);
export const redisSubscriber = createClient(clientOptions);

redisPublisher.on('error', (err) => {
  if (err.code !== 'SELF_SIGNED_CERT_IN_CHAIN') {
    console.error('Redis Publisher Error:', err);
  }
});
redisSubscriber.on('error', (err) => {
  if (err.code !== 'SELF_SIGNED_CERT_IN_CHAIN') {
    console.error('Redis Subscriber Error:', err);
  }
});

async function connectToRedis() {
  await redisPublisher.connect();
  await redisSubscriber.connect();
  console.log('Redis connected successfully');
}

export default { redisPublisher, redisSubscriber, connectToRedis };

