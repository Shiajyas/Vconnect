import { Socket, Server } from "socket.io";
import { ISUserRepository } from "../data/interfaces/ISUserRepository";
import { ObjectId } from "mongodb";
import { IUserRepository } from "../data/interfaces/IUserRepository";
import { NotificationService } from "../infrastructure/services/interfaces/INotificationService";
import { ISocketHandlers } from "./interfaces/ISocketHandlers";
import { Notification } from "../core/domain/models/NotificationModel";

export class SocketHandlers implements ISocketHandlers {
  private io: Server;

  constructor(
    private ioInstance: Server,
    private userRepository: ISUserRepository, // In-memory active user repository
    private mainUserRepository: IUserRepository, // MongoDB repository
    private notificationService: NotificationService // Notification service
  ) {
    this.io = ioInstance;
  }

  joinUser(socket: Socket, id: string): void {
    try {
      console.log(`🔹 User ${id} attempting to join with socket ID ${socket.id}`);
      this.userRepository.addUser({ id: id, socketId: socket.id });
      console.log(`✅ User ${id} joined successfully`);
      socket.emit("joinSuccess", { userId: id });
    } catch (error) {
      this.handleError(socket, error, "joinError");
    }
  }

  postUploaded(socket:Socket,  userId: string, postId: string ) {
    
  }

  logActiveUsers(): { userId: string; socketId: string; }[] {
    throw new Error("Method not implemented.");
  }

  joinAdmin(socket: Socket, id: string): void {
    console.log(` Admin ${id} connected.`);
    this.userRepository.removeUserById(id);
    this.userRepository.addUser({ id, socketId: socket.id });
    // console.log(` Admin connected: ${id} (Socket ID: ${socket.id})`);
  }

  async followUser(socket: Socket, data: { userId: string; followingId: string }) {
    try {
      const { userId, followingId } = data;
      // console.log(" Follow request received:", data);

      if (!userId || !followingId) throw new Error("Invalid request. User IDs are required.");
      if (userId === followingId) throw new Error("You cannot follow yourself.");

      const sender = await this.mainUserRepository.findById(userId);
      if (!sender) throw new Error("User not found. Please log in again.");

      const targetUser = await this.mainUserRepository.findById(followingId);
      if (!targetUser) throw new Error("The user you are trying to follow does not exist.");

      if (sender.following?.includes(new ObjectId(followingId))) {
        throw new Error("You are already following this user.");
      }

      await this.mainUserRepository.update({ _id: userId }, { $addToSet: { following: followingId } });
      await this.mainUserRepository.update({ _id: followingId }, { $addToSet: { followers: userId } });

      // console.log(`User ${userId} followed ${followingId}`);

      await this.sendNotification(socket, userId, followingId, "follow", `${sender.username} started following you.`);

      socket.emit("followSuccess", { followingId });
    } catch (error) {
      this.handleError(socket, error, "followError");
    }
  }

  async unfollowUser(socket: Socket, data: { userId: string; followingId: string }) {
    try {
      const { userId, followingId } = data;
      // console.log(" Unfollow request received:", data);

      if (!userId || !followingId) throw new Error("Invalid request. User IDs are required.");

      const sender = await this.mainUserRepository.findById(userId);
      if (!sender) throw new Error("User not found. Please log in again.");

      const targetUser = await this.mainUserRepository.findById(followingId);
      if (!targetUser) throw new Error("The user you are trying to unfollow does not exist.");

    

      await this.mainUserRepository.update({ _id: userId }, { $pull: { following: followingId } });
      await this.mainUserRepository.update({ _id: followingId }, { $pull: { followers: userId } });

      console.log(`User ${userId} unfollowed ${followingId}`);

      await this.sendNotification(socket, userId, followingId, "unfollow", `${sender.username} unfollowed you.`);

      socket.emit("unfollowSuccess", { followingId });
    } catch (error) {
      this.handleError(socket, error, "unfollowError");
    }
  }

  private async sendNotification(
    socket: Socket,
    senderId: string,
    receiverId: string,
    type: "follow" | "unfollow",
    message: string
  ) {
    try {
      console.log(`🔔 Sending notification to ${receiverId}`);

      const receiver = this.userRepository.findById(receiverId.toString());

      console.log(receiver,"321456");
      

      if (!receiver) {
        console.log(`⚠️ User ${receiverId} is not online, skipping real-time notification.`);
        return;
      }

      const notification = new Notification({
        senderId,
        receiverId,
        type,
        message,
        isRead: false,
      });

      await notification.save();

      if (receiver.socketId) {
       
        this.io.to(receiver.socketId).emit("newNotification", {
          type,
          message,
          senderId,
          receiverId,
          isRead: notification,
          timestamp: notification.createdAt,
        });
        console.log("sucess 341");
        
      }
    } catch (error) {
      console.error("❌ Notification Error:", error);
    }
  }

  private handleError(socket: Socket, error: unknown, event: string) {
    console.error(`❌ ${event} Error:`, error instanceof Error ? error: error);
    socket.emit(event, { message: error instanceof Error ? error.message : "An unknown error occurred." });
  }
}
