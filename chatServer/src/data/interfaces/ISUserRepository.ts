import { SUser } from '../../core/domain/interfaces/SUser';

export interface ISUserRepository {
  findById(id: string): Promise<SUser | undefined>;
  addUser(user: SUser): Promise<void>;
  removeUser(socketId: string): Promise<void>;
  getActiveUsers(): Promise<SUser[]>;
  removeUserById(userId: string): Promise<void>;
  logActiveUsers(): Promise<{ userId: string; socketId: string }[]>;
  getActiveUserCount(): Promise<number>;
  updateChatSocketId(userId: string, chatSocketId: string): Promise<void>
}
