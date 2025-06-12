import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redis: Redis;

// Use REDIS_URL if provided (priority), else use REDIS_HOST + REDIS_PORT
if (process.env.REDIS_URL) {
  console.log('✅ Using Redis URL:', process.env.REDIS_URL);
  redis = new Redis(process.env.REDIS_URL);
} else {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  
  console.log(`✅ Connecting to Redis at ${host}:${port}`);
  redis = new Redis({ host, port });
}

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

export default redis;
