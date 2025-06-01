
import { SUser } from "../../core/domain/interfaces/SUser";

export interface ISUserRepository {
  findById(id: string): SUser | undefined;
  addUser(user: SUser): void;
  removeUser(socketId: string): void;
  getActiveUsers(): SUser[];
  removeUserById(userId: string): void;
  logActiveUsers(): { userId: string; socketId: string }[];
  getActiveUserCount(): number 


}
