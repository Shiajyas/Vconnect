import { Notification } from "../core/domain/models/NotificationModel";
import { INotificationService } from "./interfaces/InotificationService";
import { ISUserRepository } from "../data/interfaces/ISUserRepository";
import { Server } from "socket.io";


export class NotificationService implements INotificationService {
  private io: Server;
  private userRepository: ISUserRepository;

  constructor(io: Server, userRepository: ISUserRepository) {
    this.io = io;
    this.userRepository = userRepository;
  }

  async sendNotification(
    senderId: string,
    receiverIds: string[],
    type: "follow" | "unfollow" | "like" | "comment" | "mention" | "post",
    message: string,
    postId?: string
  ): Promise<void> {
    try {
      console.log(`🔔 Sending notifications to ${receiverIds.length} users`);

      // Fetch all valid receivers from DB
      let receivers = await Promise.all(
        receiverIds.map(async (id) => {
          const user = await this.userRepository.findById(id);
          return user ? { _id: user.id, socketId: user.socketId } : null;
        })
      );

      receivers = receivers.filter((receiver) => receiver !== null);
      console.log("✅ Valid Receivers:", receivers);

      if (!receivers.length) {
        console.log(`⚠️ No valid receivers found.`);
        return;
      }

      // Extract user IDs for notification storage
      const receiverUserIds = receivers.map((receiver) => receiver?._id);

      // Create a single notification object (all followers in one document)
      const notification = new Notification({
        senderId,
        receiverId: receiverUserIds, // Store all followers in the array
        type,
        message,
        postId,
        isRead: false,
      });

      // Save the notification in DB
      await notification.save();
      console.log(`✅ Notification saved for ${receivers.length} users`);

      // Emit real-time notifications to online users
      receivers.forEach((receiver) => {
        if (receiver?.socketId) {
          this.io.to(receiver.socketId).emit("newNotification", {
            type,
            message,
            senderId,
            receiverId: receiverUserIds, // All receivers
            postId,
            isRead: false,
            timestamp: new Date(),
          });

          console.log(`📩 Notification sent to online user ${receiver._id} (Socket ID: ${receiver.socketId})`);
        } else {
          console.log(`⚠️ User ${receiver?._id} is offline, storing notification.`);
        }
      });
    } catch (error) {
      console.error("❌ Error in sendNotification:", error);
    }
  }
}
