import { Socket } from "socket.io";
import { ObjectId } from "mongodb";
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
  
        // console.log(`📸 Post uploaded by ${userId} (Post ID: ${postId})`);
  
        let owner = await this.userRepository.findById(userId);
        if (!owner) throw new Error("User not found.");
  
        let followers = await this.userRepository.findFollowers(userId);
        let following = await this.userRepository.findFollowing(userId);
  
        let receiverIds = [...followers, ...following].map(user => user._id.toString());
        socket.broadcast.emit("postUpload", { postId });
        if (receiverIds.length) {
          const message = `${owner.fullname} has uploaded a new post.`;
          await this.notificationService.sendNotification( userId, receiverIds, "post", message, postId,owner.username);
        }
      } catch (error) {
        this.handleError(socket, error, "postUploadError");
      }
    }

    async likePost(socket: Socket, userId: string, postId: string, type: string) {
      try {
        if (!userId || !postId) throw new Error("Invalid request. User ID and Post ID are required.");
    
        console.log(`❤️ ${type === "unlike" ? "Unlike" : "Like"} received from ${userId} for Post ID: ${postId}`);
    
        if (type === "unlike") {
          await this.postRepository.unlikePost(userId, postId);
        } else {
          await this.postRepository.likePost(userId, postId);
        }
        const updatedPost = await this.postRepository.getPost(postId);
        if (!updatedPost) throw new Error("Post not found or failed to update.");
    
        const likesArray = Array.isArray(updatedPost.likes) ? updatedPost.likes : [];

        this.io.emit("update_like_count", { postId, likes: likesArray.length });
        socket.broadcast.emit("update_like_count", { postId, likes: likesArray.length });
    
        const [postOwner, likePerson] = await Promise.all([
          this.userRepository.findById(updatedPost.userId),
          this.userRepository.findById(userId),
        ]);
    
        if (!postOwner || !likePerson) throw new Error("User not found.");
    
        if (postOwner._id.toString() !== userId) {
          const ownerMessage = `${likePerson.fullname} ${type === "unlike" ? "unliked" : "liked"} your post.`;
          await this.notificationService.sendNotification(
            userId,
            [postOwner._id.toString()],
            "like",
            ownerMessage,
            postId,
            postOwner.username
          );
        }
      } catch (error) {
        this.handleError(socket, error, "likeError");
      }
    }
    

    async addComment(socket: Socket, data: { userId: string; postId: string; content: string }) {
      try {
        if (!data.userId || !data.postId || !data.content) throw new Error("Invalid request. User ID, Post ID, and Content are required.");
  
        console.log(`💬 Comment added by ${data.userId} on Post ID: ${data.postId}`);
  
        const post = await this.postRepository.getPost(data.postId);
        if (!post) throw new Error("Post not found.");
  
        const comment = {
          userId: new ObjectId(data.userId),
          content: data.content,
        };
  
        post.comments.push(comment as any);
        await post.save();
  
        socket.broadcast.emit("update_comment", { postId: data.postId, comments: post.comments });
  
        const postOwner = await this.userRepository.findById(post.userId);
        if (!postOwner) throw new Error("Post owner not found.");
  
        if (postOwner._id.toString() !== data.userId) {
          const ownerMessage = `${comment.userId} commented on your post.`;
          await this.notificationService.sendNotification(data.userId, [postOwner._id.toString()], "comment", ownerMessage, data.postId,postOwner.username);
        }
      } catch (error) {
        this.handleError(socket, error, "commentError");
      }
    }
    
    async savePost(socket: Socket, postId: string, userId: string) {
      try {
      let res =  await this.postRepository.savePost(postId, userId);
      if(res){
        console.log("saved post",postId)
      }
        
        socket.emit("postSaved", { userId, saved: res });
      } catch (error) {
        this.handleError(socket, error, "savePostError");
      }
    }

    async deletePost(socket: Socket, postId: string, userId: string) {
      try {
      let res =  await this.postRepository.deletePost(postId, userId);
      if(res){
        console.log("saved post",postId)
      }
        
        socket.emit("deletePost", { userId });
      } catch (error) {
        this.handleError(socket, error, "savePostError");
      }
    }
    
  
    private handleError(socket: Socket, error: unknown, event: string) {
      console.error(`❌ ${event} Error:`, error instanceof Error ? error.message : error);
      socket.emit(event, { message: error instanceof Error ? error.message : "An unknown error occurred." });
    }
  }