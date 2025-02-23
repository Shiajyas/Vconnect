import { ISUserRepository } from "../interfaces/ISUserRepository";
import { SUser } from "../../core/domain/interfaces/SUser";

export class SUserRepositoryImpl implements ISUserRepository {
  private users: Map<string, SUser> = new Map(); // Using Map for fast lookups

  findById(id: string): SUser | undefined {
    // console.log(`🔍 Searching for user with ID: ${id}`);
    console.log(this.users);
    
    let user = this.users.get(id);

    if (!user) {
      console.log(`⚠️ User not found: ${id}`);
      return undefined;
    }

    // console.log(` User found:`, user);
    return user;
  }

  addUser(user: SUser): void {
    console.log(`📌 Adding user: ${JSON.stringify(user)}`);
    this.removeUser(user.socketId); // Ensure no duplicate socket IDs exist
    this.users.set(user.id, user);
    console.log(`✅ User added: ${user.id} (Socket ID: ${user.socketId})`);
    this.logActiveUsers();
  }

  removeUser(socketId: string): void {
    let removedUserId: string | null = null;

    for (const [id, user] of this.users) {
      if (user.socketId === socketId) {
        removedUserId = id;
        this.users.delete(id);
        break;
      }
    }

    if (removedUserId) {
      console.log(`❌ User removed: ${removedUserId} (Socket ID: ${socketId})`);
    } else {
      console.log(`⚠️ No user found for Socket ID: ${socketId}`);
    }

    this.logActiveUsers();
  }

  removeUserById(userId: string): void {
    if (this.users.has(userId)) {
      this.users.delete(userId);
      console.log(`❌ User removed by ID: ${userId}`);
    } else {
      console.log(`⚠️ No user found with ID: ${userId}`);
    }
  }

  getActiveUsers(): SUser[] {
    return Array.from(this.users.values());
  }

  logActiveUsers(): { userId: string; socketId: string }[] {
    const activeUsers = this.getActiveUsers().map((user) => ({
      userId: user.id,
      socketId: user.socketId,
    }));

    console.log("📢 Currently Active Users:", activeUsers);
    return activeUsers;
  }
}
