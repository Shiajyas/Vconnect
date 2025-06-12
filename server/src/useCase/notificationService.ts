import { Notification } from '../core/domain/models/NotificationModel';
import { INotificationService } from './interfaces/InotificationService';
import { ISUserRepository } from '../data/interfaces/ISUserRepository';
import { IUserRepository } from '../data/interfaces/IUserRepository';
import { Server } from 'socket.io';

export class NotificationService implements INotificationService {
  private io: Server;
  private userRepository: ISUserRepository;
  private mainRepo: IUserRepository;

  constructor(
    io: Server,
    userRepository: ISUserRepository,
    mainRepo: IUserRepository,
  ) {
    this.io = io;
    this.userRepository = userRepository;
    this.mainRepo = mainRepo;
  }

  async sendNotification(
    senderId: string,
    receiverIds: string[],
    type:
      | 'follow'
      | 'unfollow'
      | 'like'
      | 'comment'
      | 'mention'
      | 'post'
      | 'replay',
    message: string,
    postId?: string,
    senderName?: string,
  ): Promise<void> {
    try {
      console.log(`🔔 Sending notifications to ${receiverIds.length} users`);

      if (!receiverIds || receiverIds.length === 0) {
        console.log('⚠️ No receiver IDs provided. Skipping notification.');
        return;
      }

      // Fetch users from the main database
      const allReceivers = await Promise.all(
        receiverIds.map(async (id) => {
          if (!id) return null; // Ensure ID is valid before querying

          if (typeof id === 'object' && id !== null && '_id' in id) {
            id = (id as any)._id.toString(); // Extract `_id` from object and convert to string
          }

          const user = await this.mainRepo.findById(id.toString());
          const onlineUser = await this.userRepository.findById(id.toString());
          console.log(user, 'formm save');
          if (!user) return null; // Ensure user exists

          return { _id: user._id, socketId: onlineUser?.socketId || null };
        }),
      );

      // Filter out invalid users
      const validReceivers = allReceivers.filter(
        (receiver) => receiver !== null,
      );

      console.log('✅ Valid Receivers:', validReceivers);

      if (!validReceivers.length) {
        console.log(
          `⚠️ No valid receivers found. Notification will not be stored.`,
        );
        return;
      }

      // Extract user IDs for storage
      const receiverUserIds = validReceivers
        .map((receiver) => receiver?._id)
        .filter(Boolean);

      if (receiverUserIds.length === 0) {
        console.log(
          `⚠️ No valid receiver IDs found. Skipping notification storage.`,
        );
        return;
      }

      // Create a single notification object for all receivers
      const notification = new Notification({
        senderId,
        receiverId: receiverUserIds, // Store all valid receivers
        type,
        message,
        postId,
        senderName,
        isRead: false,
      });

      // Save the notification in DB
      await notification.save();
      console.log(`✅ Notification saved for ${validReceivers.length} users`);

      // Emit real-time notifications **only to online users**
      validReceivers.forEach((receiver) => {
        if (receiver?.socketId) {
          this.io.to(receiver.socketId).emit('newNotification', {
            type,
            message,
            senderId,
            receiverId: receiverUserIds,
            postId,
            senderName,
            isRead: false,
            timestamp: new Date(),
          });

          console.log(
            `📩 Notification sent to online user ${receiver._id} (Socket ID: ${receiver.socketId})`,
          );
        } else {
          console.log(
            `⚠️ User ${receiver?._id} is offline. Notification stored in DB.`,
          );
        }
      });
    } catch (error) {
      console.error('❌ Error in sendNotification:', error);
    }
  }
}
