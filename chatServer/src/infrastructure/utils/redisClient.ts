
import Redis from 'ioredis';
const redis = new Redis({
  host: 'my-redis', 
  port: 6379,
});
export default redis;
