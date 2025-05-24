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

  async addUser(userId: string, data: { socketId: string, username: string, avatar: string }) {
    await this.addOnlineSocket(userId, data.socketId);
  }
  async removeUser(userId: string, socketId: string) {
    await this.removeOnlineSocket(userId, socketId);
  }

  async getUserOnlineSocketIds(userId: string): Promise<string[]> {
    return await this.getOnlineSocketIds(userId);
  }

  async getAllOnlineUsers(): Promise<{ userId: string, socketId: string }[]> {
    const keys = await redisClient.keys(this.USER_SOCKET_SET_PREFIX + '*');
    const onlineUsers = []; 
    for (const key of keys) {
      const userId = key.split(':')[1];
      const socketIds = await redisClient.smembers(key);
      for (const socketId of socketIds) {
        onlineUsers.push({ userId, socketId });
      }
    }
    return onlineUsers;
}

  async getOnlineUserCount(): Promise<number> {
    const keys = await redisClient.keys(this.USER_SOCKET_SET_PREFIX + '*');
    return keys.length;
  }


}


export const onlineUserService = new OnlineUserService();
