import { Socket } from "socket.io";
import { ObjectId } from "mongodb";
import { ICommentSocketService } from "./Interface/ICommentSocketService";
import { ICommentRepository } from "../../../data/interfaces/ICommentRepository";
import { IUserRepository } from "../../../data/interfaces/IUserRepository";
import { NotificationService } from "../../notificationService";
import { IPostRepository } from "../../../data/interfaces/IPostRepository";
import { Server } from "socket.io";

export class CommentSocketService implements ICommentSocketService {
  private io: Server;
  private commentRepository: ICommentRepository;
  private userRepository: IUserRepository;
  private notificationService: NotificationService;
  private postRepository: IPostRepository;

  constructor(
    ioInstance: Server,
    commentRepo: ICommentRepository,
    userRepo: IUserRepository,
    notificationService: NotificationService,
    postRepo: IPostRepository
  ) {
    this.io = ioInstance;
    this.commentRepository = commentRepo;
    this.userRepository = userRepo;
    this.notificationService = notificationService;
    this.postRepository = postRepo;
  }

  async addComment(socket: Socket, data: { userId: string; postId: string; content: string; parentId?: string }) {
    try {
      if (!data.userId || !data.postId || !data.content) throw new Error("Invalid request. User ID, Post ID, and Content are required.");

      console.log(`💬 Comment added by ${data.userId} on Post ID: ${data.postId} 222`);

      const newComment = await this.commentRepository.addComment(data);
      if (!newComment) throw new Error("Failed to add comment.");

      
      socket.broadcast.emit("newComment", { postId: data.postId, comment: newComment });

      // console.log("comment added ❤️ ", newComment);
      const commentHolder = await this.userRepository.findById(data.userId);
      if (!commentHolder) throw new Error("User not found.");

      const postOwner = await this.postRepository.getPostOwner(data.postId);
      if (!postOwner) throw new Error("User not found.");
      const { _id : postOwnerId, userId} = postOwner as unknown as { _id: ObjectId, userId: { _id: ObjectId, fullname: string, username: string } };

      // console.log("post owner", postOwner);

      // console.log("post owner id", commentHolder._id.toString());
      // console.log("data user id", userId._id.toString);

      if ( userId._id.toString() !== data.userId) {
        const ownerMessage = `${commentHolder.fullname} commented on your post.`;
        console.log("owner message", ownerMessage);
        
        await this.notificationService.sendNotification(data.userId, [userId._id.toString()], "comment", ownerMessage, data.postId, userId.username);
      }else{ 
        console.log("owner message", "no owner message");
        
      }
    } catch (error) {
      this.handleError(socket, error, "commentError");
    }
  }

  async deleteComment(socket: Socket, userId: string, commentId: string) {
    try {
      if (!userId || !commentId) throw new Error("Invalid request. User ID and Comment ID are required.");

      console.log(`🗑️ Comment deleted by ${userId} (Comment ID: ${commentId})`);

      const deleted = await this.commentRepository.deleteComment(commentId);
      if (!deleted) throw new Error("Failed to delete comment.");

      socket.broadcast.emit("delete_comment", { commentId });
    } catch (error) {
      this.handleError(socket, error, "deleteCommentError");
    }
  }

  async likeComment(socket: Socket, userId: string, commentId: string) {
    try {
      if (!userId || !commentId) throw new Error("Invalid request. User ID and Comment ID are required.");

      // console.log(`❤️ Like received from ${userId} for Comment ID: ${commentId}`);

      const updatedComment = await this.commentRepository.likeComment(commentId, userId);
      if (!updatedComment) throw new Error("Failed to like comment.");

      socket.broadcast.emit("update_like_count", { commentId, likes: updatedComment.likes });

      const commentOwner = await this.userRepository.findById(updatedComment.commentId);
      if (!commentOwner) throw new Error("Comment owner not found.");

      if (commentOwner._id.toString() !== userId) {
        const message = `${commentOwner.fullname} liked your comment.`;
        await this.notificationService.sendNotification(userId, [commentOwner._id.toString()], "like", message, commentId, commentOwner.username);
      }
    } catch (error) {
      this.handleError(socket, error, "likeCommentError");
    }
  }

  private handleError(socket: Socket, error: unknown, event: string) {
    console.error(`❌ ${event} Error:`, error instanceof Error ? error.message : error);
    socket.emit(event, { message: error instanceof Error ? error.message : "An unknown error occurred." });
  }
}
