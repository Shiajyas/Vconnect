import { Socket, Server } from "socket.io";
import { ISUserRepository } from "../data/interfaces/ISUserRepository";
import { ObjectId } from "mongodb";
import { IUserRepository } from "../data/interfaces/IUserRepository";
import { NotificationService } from "../infrastructure/services/interfaces/INotificationService";
import { ISocketHandlers } from "./interfaces/ISocketHandlers";
import { Notification } from "../core/domain/models/NotificationModel";
import { IPostRepository } from "../data/interfaces/IPostRepository";

export class SocketHandlers implements ISocketHandlers {
  private io: Server;

  constructor(
    private ioInstance: Server,
    private userRepository: ISUserRepository, // In-memory active user repository
    private mainUserRepository: IUserRepository, // MongoDB repository
    private notificationService: NotificationService, // Notification service
    private MainPostRepository: IPostRepository
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

  async postUploaded(socket: Socket, userId: string, postId: string) {
    try {
      if (!userId || !postId) throw new Error("Invalid request. User ID and Post ID are required.");
  
      console.log(`📸 Post uploaded by ${userId} (Post ID: ${postId})>>>>1`);
  
      // Fetch the owner's details
      let owner = await this.mainUserRepository.findById(userId);
      if (!owner) throw new Error("User not found.");
  
      console.log("Owner>>>>", owner);
  
      // Fetch followers and following users
      let followers = await this.mainUserRepository.findFollowers(userId);
      let following = await this.mainUserRepository.findFollowing(userId);
  
      console.log("Following>>>>", following);
      console.log("Followers>>>>", followers);
  
      // Extract only the `_id` values and convert them to strings
      let receiverIds = [...followers, ...following].map((user) => user._id.toString());
  
      console.log("Receiver IDs>>>>", receiverIds);
  
      if (receiverIds.length) {
        // Include owner's name in the notification message
        const message = `${owner.fullname} has uploaded a new post.`;
  
        await this.sendNotification(socket, userId, receiverIds, "post", message, postId);
        console.log(`🔔 Notifications sent to ${receiverIds.length} followers`);
      }
  
    } catch (error) {
      this.handleError(socket, error, "postUploadError");
    }
  }
  async likePost(socket: Socket, userId: string, postId: string, type: string) {
    try {
      if (!userId || !postId) throw new Error("Invalid request. User ID and Post ID are required.");
  
      console.log(`❤️ ${type === "unlike" ? "Unlike" : "Like"} received from ${userId} for Post ID: ${postId}`);
  
      // Fetch updated post after REST API handles like/unlike
      const updatedPost = await this.MainPostRepository.getPost(postId);
      if (!updatedPost) throw new Error("Post not found or failed to update.");
  
      console.log(`🔄 Updated Like Count: ${updatedPost.likes.length} for Post ID: ${postId}`);
  
      // Emit updated like count
      socket.broadcast.emit("update_like_count", { postId, likes: updatedPost.likes.length });
  
      // Fetch post owner and liker details
      const [postOwner, likePerson] = await Promise.all([
        this.mainUserRepository.findById(updatedPost.userId),
        this.mainUserRepository.findById(userId),
      ]);
  
      if (!postOwner) throw new Error("Post owner not found.");
      if (!likePerson) throw new Error("Liker user not found.");
  
      // Prevent self-like notifications
      if (postOwner._id.toString() === userId) {
        console.log("User liked/unliked their own post, no notification sent.");
        return;
      }
  
      // Fetch followers and following
      const [followers, following] = await Promise.all([
        this.mainUserRepository.findFollowers(postOwner._id.toString()),
        this.mainUserRepository.findFollowing(postOwner._id.toString()),
      ]);
  
      // Get unique receiver IDs
      let receiverIds = new Set([
        ...followers.map((user) => user._id.toString()),
        ...following.map((user) => user._id.toString()),
      ]);
  
      receiverIds.delete(postOwner._id.toString());
      receiverIds.delete(likePerson._id.toString());
  
      if (receiverIds.size) {
        if(type === "like"){

          const message = `${likePerson.fullname} liked ${postOwner.fullname}'s post.`;
          await this.sendNotification(socket, userId, Array.from(receiverIds), "like", message, postId);
          console.log(`🔔 Notifications sent to ${receiverIds.size} followers`);
        }

      }

      if (postOwner._id.toString() !== userId && postOwner._id !== likePerson._id) {

        const ownerMessage = `${likePerson.fullname} ${type === "unlike" ? "unliked" : "liked"} your post.`;
        await this.sendNotification(socket, userId, [postOwner._id.toString()], "like", ownerMessage, postId);
        console.log(`🔔 Notification sent to post owner (${postOwner.fullname})`);
      }
  
      
    } catch (error) {
      this.handleError(socket, error, "likeError");
    }
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

      await this.sendNotification(socket, userId, [followingId], "follow", `${sender.username} started following you.`);

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

      await this.sendNotification(socket, userId, [followingId], "unfollow", `${sender.username} unfollowed you.`);

      socket.emit("unfollowSuccess", { followingId });
    } catch (error) {
      this.handleError(socket, error, "unfollowError");
    }
  }
  private async sendNotification(
    socket: Socket,
    senderId: string,
    receiverIds: string[], // Array of followers
    type: "follow" | "unfollow" | "like" | "comment" | "mention" | "post",
    message: string,
    postId?: string // Optional postId for post-related notifications
  ) {
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
  
  

  

  private handleError(socket: Socket, error: unknown, event: string) {
    console.error(`❌ ${event} Error:`, error instanceof Error ? error: error);
    socket.emit(event, { message: error instanceof Error ? error.message : "An unknown error occurred." });
  }
}
