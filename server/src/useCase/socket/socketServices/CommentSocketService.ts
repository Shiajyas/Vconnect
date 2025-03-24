import { Socket } from "socket.io";
import { ObjectId } from "mongodb";
import { ICommentSocketService } from "./Interface/ICommentSocketService";
import { ICommentRepository } from "../../../data/interfaces/ICommentRepository";
import { IUserRepository } from "../../../data/interfaces/IUserRepository";
import { NotificationService } from "../../notificationService";
import { IPostRepository } from "../../../data/interfaces/IPostRepository";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { IPost } from "../../../core/domain/interfaces/IPost";

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
      const { userId, postId, content, parentId } = data;
  
      console.log(`💬 Comment added by ${userId} on Post ${postId}, Parent: ${parentId || "None"}`);
  
      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(postId)) {
        throw new Error("Invalid User ID or Post ID.");
      }
  
      const parentCommentId = parentId && mongoose.Types.ObjectId.isValid(parentId)
        ? new mongoose.Types.ObjectId(parentId)
        : null;
  
      const commentData: any = {
        postId: new mongoose.Types.ObjectId(postId),
        userId: new mongoose.Types.ObjectId(userId),
        content,
        likes: [],
        parentCommentId,
        mentions: [],
      };
  
      const newComment = await this.commentRepository.addComment(commentData);
  
      if (parentCommentId) {
        await this.commentRepository.addReply(parentCommentId, newComment._id);
  
        this.io.emit("newReply", { postId, parentCommentId, reply: newComment });
  
        // Notify parent comment owner
        const parentComment = await this.commentRepository.findCommentById(parentId);
        if (parentComment && parentComment.userId?._id.toString() !== userId) {
          const commentAuthor = await this.userRepository.findById(userId);
          if (!commentAuthor) throw new Error("User not found.");
  
          console.log("Parent Comment Owner ID:", parentComment.userId.toString());
  
          const message = `${commentAuthor.fullname} replied to your comment.`;
          await this.notificationService.sendNotification(
            userId,
            [parentComment.userId._id.toString()],
            "replay",
            message,
            postId,
            commentAuthor.fullname
          );
        }
      } else {
        this.io.emit("newComment", { postId, comment: newComment });
  
        const postOwner: IPost | null = await this.postRepository.getPost(postId);
  
        console.log("Post Owner ID:", postOwner?.userId?._id.toString());
  
        if (postOwner && postOwner.userId._id.toString() !== userId) {
          const commentAuthor = await this.userRepository.findById(userId);
          if (!commentAuthor) throw new Error("User not found.");
  
          const message = `${commentAuthor.fullname} commented on your post.`;
          await this.notificationService.sendNotification(
            userId,
            [postOwner.userId._id.toString()],
            "comment",
            message,
            postId.toString(),
            commentAuthor.fullname
          );
        }
      }
    } catch (error) {
      this.handleError(socket, error, "commentError");
    }
  }
  
  

  async deleteComment(socket: Socket, commentId: string) {
    try {
      if (!commentId) throw new Error("Invalid request. Comment ID is required.");
  
      const res = await this.commentRepository.getCommentDetails(commentId);
  
      const deleted = await this.commentRepository.deleteComment(commentId);
      if (!deleted) throw new Error("Failed to delete comment.");
  
      let parentId = res?.parentCommentId
      let postId = res?.postId

      if (parentId) {
        console.log("replay")
        this.io.emit("delete_reply", { commentId, postId, parentId });
      } else {
        console.log("comment")
        this.io.emit("delete_comment", { commentId, postId });
      }
    } catch (error) {
      this.handleError(socket, error, "deleteCommentError");
    }
  }
  

  async likeComment(socket: Socket, userId: string, commentId: string) {
    try {
      console.log(userId, "to", commentId, ">>>>>>>>>>>>>>>>>>>>>");
  
      if (!userId || !commentId) throw new Error("Invalid request. User ID and Comment ID are required.");
  
      // Add the like
      const updatedComment = await this.commentRepository.likeComment(commentId, userId);
      if (!updatedComment) throw new Error("Failed to like comment.");
  
      // Debugging Log
      console.log("Updated Likes Array:", updatedComment.likes);
  
      // Emit to all users (including sender)
      const likesArray = Array.isArray(updatedComment.likes) ? updatedComment.likes : [];
      this.io.emit("commentLiked", { commentId, likes: updatedComment.likes });
  
      // Retrieve the comment to get the owner userId
      const comment = await this.commentRepository.findCommentById(commentId);
      if (!comment) throw new Error("Comment not found.");
  
      // Notify the comment owner
      const commentOwner = await this.userRepository.findById(comment.userId);
      if (!commentOwner) throw new Error("Comment owner not found.");
  
      if (commentOwner._id.toString() !== userId) {
        const message = `${commentOwner.fullname} liked your comment.`;
        await this.notificationService.sendNotification(userId, [commentOwner._id.toString()], "like", message, commentId, commentOwner.fullname);
      }
    } catch (error) {
      this.handleError(socket, error, "likeCommentError");
    }
  }
  
  
  async unLikeComment(socket: Socket, userId: string, commentId: string) {
    try {
      console.log(userId, "removing like from", commentId, ">>>>>>>>>>>>>>>>>>>>>");
      if (!userId || !commentId) throw new Error("Invalid request. User ID and Comment ID are required.");
  
      // Remove the like
      const updatedComment = await this.commentRepository.unLikeComment(commentId, userId);
      if (!updatedComment) throw new Error("Failed to unlike comment.");
  
      // Emit the updated likes count
      this.io.emit("commentLiked", { commentId, likes: updatedComment.likes || [] });

    } catch (error) {
      console.log(error,">>>>>>>>>>>>123")
      this.handleError(socket, error, "unLikeCommentError");
    }
  }
  
  private handleError(socket: Socket, error: unknown, event: string) {
    console.error(`❌ ${event} Error:`, error instanceof Error ? error.message : error);
    socket.emit(event, { message: error instanceof Error ? error.message : "An unknown error occurred." });
  }
}
