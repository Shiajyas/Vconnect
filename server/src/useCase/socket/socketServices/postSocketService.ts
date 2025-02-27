import { Socket } from "socket.io";
import { IPostSocketService } from "./Interface/IPostSocketService";
import { IPostRepository } from "../../../data/interfaces/IPostRepository";
import { IUserRepository } from "../../../data/interfaces/IUserRepository";
import { NotificationService } from "../../notificationService";
import { Server } from "socket.io";


export class PostSocketService implements IPostSocketService {
    private io: Server;
    private userRepository: IUserRepository;
    private postRepository: IPostRepository;
    private notificationService: NotificationService;
  
    constructor(ioInstance: Server, userRepo: IUserRepository, postRepo: IPostRepository, notificationService: NotificationService) {
      this.io = ioInstance;
      this.userRepository = userRepo;
      this.postRepository = postRepo;
      this.notificationService = notificationService;
    }
  
    async postUploaded(socket: Socket, userId: string, postId: string) {
      try {
        if (!userId || !postId) throw new Error("Invalid request. User ID and Post ID are required.");
  
        console.log(`📸 Post uploaded by ${userId} (Post ID: ${postId})`);
  
        let owner = await this.userRepository.findById(userId);
        if (!owner) throw new Error("User not found.");
  
        let followers = await this.userRepository.findFollowers(userId);
        let following = await this.userRepository.findFollowing(userId);
  
        let receiverIds = [...followers, ...following].map(user => user._id.toString());
  
        if (receiverIds.length) {
          const message = `${owner.fullname} has uploaded a new post.`;
          await this.notificationService.sendNotification( userId, receiverIds, "post", message, postId);
        }
      } catch (error) {
        this.handleError(socket, error, "postUploadError");
      }
    }
  
    async likePost(socket: Socket, userId: string, postId: string, type: string) {
      try {
        if (!userId || !postId) throw new Error("Invalid request. User ID and Post ID are required.");
  
        console.log(`❤️ ${type === "unlike" ? "Unlike" : "Like"} received from ${userId} for Post ID: ${postId}`);
  
        const updatedPost = await this.postRepository.getPost(postId);
        if (!updatedPost) throw new Error("Post not found or failed to update.");
  
        socket.broadcast.emit("update_like_count", { postId, likes: updatedPost.likes.length });
  
        const [postOwner, likePerson] = await Promise.all([
          this.userRepository.findById(updatedPost.userId),
          this.userRepository.findById(userId),
        ]);
  
        if (!postOwner || !likePerson) throw new Error("User not found.");
  
        if (postOwner._id.toString() !== userId) {
          const ownerMessage = `${likePerson.fullname} ${type === "unlike" ? "unliked" : "liked"} your post.`;
          await this.notificationService.sendNotification(userId, [postOwner._id.toString()], "like", ownerMessage, postId);
        }
      } catch (error) {
        this.handleError(socket, error, "likeError");
      }
    }
  
    private handleError(socket: Socket, error: unknown, event: string) {
      console.error(`❌ ${event} Error:`, error instanceof Error ? error.message : error);
      socket.emit(event, { message: error instanceof Error ? error.message : "An unknown error occurred." });
    }
  }