import { redisClient } from "../config/redis.config";

class OnlineUserService {
  private readonly USER_SOCKET_SET_PREFIX = 'user:sockets:';

  async addOnlineSocket(userId: string, socketId: string) {
    const key = this.USER_SOCKET_SET_PREFIX + userId;
    await redisClient.sadd(key, socketId);
  }

  async removeOnlineSocket(userId: string, socketId: string) {
    const key = this.USER_SOCKET_SET_PREFIX + userId;
    await redisClient.srem(key, socketId);

    // Optionally, clean up empty sets
    const count = await redisClient.scard(key);
    if (count === 0) {
      await redisClient.del(key);
    }
  }

  async getOnlineSocketIds(userId: string): Promise<string[]> {
    const key = this.USER_SOCKET_SET_PREFIX + userId;
    return await redisClient.smembers(key);
  }
}

export const onlineUserService = new OnlineUserService();
