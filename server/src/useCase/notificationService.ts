import { IUserRepository } from "../data/interfaces/IUserRepository";
import { InotificationService } from "./interfaces/InotificationService";
import { InotificationRepo } from "../data/interfaces/InotificationRepo";
import { log } from "console";

export class NotificationService implements InotificationService {
  constructor(
    private userRepository: IUserRepository,
    private notificationRepo: InotificationRepo
  ) {}

  async getUnreadCount(userId: string): Promise<number> {
    // Validate user existence
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    let count = await this.notificationRepo.getUnreadCount(userId);

    console.log(count,">>>>>325")
    // Fetch unread notification count
    return count
  }

  async markAsRead(userId: string): Promise<void> {
    // Ensure user exists before marking notifications
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await this.notificationRepo.markNotificationsAsRead(userId);
  }
}
