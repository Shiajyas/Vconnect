import { ISUserRepository } from '../interfaces/ISUserRepository';
import { SUser } from '../../core/domain/interfaces/SUser';
import redis from '../../infrastructure/utils/redisClient';

const ONLINE_USERS_KEY = 'online_users';
const SOCKET_TO_USER_KEY = 'socket_to_user';        

export class SUserRepositoryImpl implements ISUserRepository {
  async findById(id: string): Promise<SUser | undefined> {
    try {         
      const userJson = await redis.hget(ONLINE_USERS_KEY, id);
      return userJson ? JSON.parse(userJson) : undefined;
    } catch (error) {
      console.error(`❌ Error finding user by ID ${id}:`, error);
      return undefined;
    }
  }

  async addUser(user: SUser): Promise<void> {
    try {
      await this.removeUser(user.socketId); // clean previous entry if any

      await redis.hset(ONLINE_USERS_KEY, user.id, JSON.stringify(user));
      await redis.hset(SOCKET_TO_USER_KEY, user.socketId, user.id);

      console.log(`✅ User added: ${user.id} (Socket ID: ${user.socketId})`);
    } catch (error) {
      console.error(`❌ Failed to add user ${user.id}:`, error);
    }
  }


   async updateChatSocketId(userId: string, chatSocketId: string): Promise<void> {
    try {
      const userJson = await redis.hget(ONLINE_USERS_KEY, userId);
      const user: SUser = userJson ? JSON.parse(userJson) : { id: userId };

      user.chatSocketId = chatSocketId;

      await redis.hset(ONLINE_USERS_KEY, userId, JSON.stringify(user));
      await redis.hset(SOCKET_TO_USER_KEY, chatSocketId, userId);

    } catch (error) {
      console.error(`❌ Failed to update chatSocketId for user ${userId}:`, error);
    }
  }
  

  async removeUser(socketId: string): Promise<void> {
    try {
      const userId = await redis.hget(SOCKET_TO_USER_KEY, socketId);
      if (userId) {
        await redis.hdel(ONLINE_USERS_KEY, userId);
        await redis.hdel(SOCKET_TO_USER_KEY, socketId);
        console.log(`🗑️ User removed: ${userId} (Socket ID: ${socketId})`);
      } else {
        console.warn(`⚠️ No user found for Socket ID: ${socketId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to remove user by socket ID ${socketId}:`, error);
    }
  }

  async removeUserById(userId: string): Promise<void> {
    try {
      const userJson = await redis.hget(ONLINE_USERS_KEY, userId);      
      if (userJson) {
        const user = JSON.parse(userJson) as SUser;
        await redis.hdel(ONLINE_USERS_KEY, userId);
        await redis.hdel(SOCKET_TO_USER_KEY, user.socketId);
        console.log(`🗑️ User removed by ID: ${userId}`);
      } else {
        console.warn(`⚠️ No user found with ID: ${userId}`);
      }       
    } catch (error) {
      console.error(`❌ Failed to remove user by ID ${userId}:`, error);
    }
  }

  async getActiveUsers(): Promise<SUser[]> {
    try {
      const userMap = await redis.hgetall(ONLINE_USERS_KEY);
      const users = Object.values(userMap).map((json) => JSON.parse(json));
      console.log(`📡 Active Users [${users.length}]:`, users);
      return users;
    } catch (error) {
      console.error('❌ Failed to fetch active users:', error);
      return [];
    }
  }

  async getActiveUserCount(): Promise<number> {
    try {
      return await redis.hlen(ONLINE_USERS_KEY);
    } catch (error) {
      console.error('❌ Failed to get active user count:', error);
      return 0;
    }
  }

  async logActiveUsers(): Promise<{ userId: string; socketId: string }[]> {
    try {
      const users = await this.getActiveUsers();
      const active = users.map((u) => ({ userId: u.id, socketId: u.socketId }));
      console.log('📋 Currently Active Users:', active);
      return active;
    } catch (error) {
      console.error('❌ Failed to log active users:', error);
      return [];
    }
  }
}
