import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create a singleton instance of the Redis client
const redis = new Redis(redisUrl);

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

export default redis;
