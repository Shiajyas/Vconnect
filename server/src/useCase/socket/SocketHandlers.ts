import { Socket, Server } from "socket.io";
import { ISocketHandlers } from "./socketServices/Interface/ISocketHandlers";
import { IUserSocketService } from "./socketServices/Interface/IUserSocketService";
import { IPostSocketService } from "./socketServices/Interface/IPostSocketService";
import { INotificationService } from "../interfaces/InotificationService";
import { ICommentSocketService } from "./socketServices/Interface/ICommentSocketService";

export class SocketHandlers implements ISocketHandlers {
  private io: Server;
  private notificationService: INotificationService;
  private userService: IUserSocketService;
  private postService: IPostSocketService;
  private commentService: ICommentSocketService;

  constructor(
    private ioInstance: Server,
  
    notificationService: INotificationService,
    userService: IUserSocketService,
    postService: IPostSocketService,
    commentService: ICommentSocketService
  ) {
    this.io = ioInstance;
    this.notificationService = notificationService;
    this.userService = userService;
    this.postService = postService;
    this.commentService = commentService;
  }

  joinUser(socket: Socket, userId: string): void {
    try {
      this.userService.addUser(socket, userId);
      socket.emit("joinSuccess", { userId });
    } catch (error) {
      this.handleError(socket, error, "joinError");
    }
  }

  async postUploaded(socket: Socket, userId: string, postId: string): Promise<void> {
    try {
      await this.postService.postUploaded(socket, userId, postId);
    } catch (error) {
      this.handleError(socket, error, "postUploadError");
    }
  }

  async likePost(socket: Socket, userId: string, postId: string, type: string): Promise<void> {
    try {
      await this.postService.likePost(socket, userId, postId, type);
    } catch (error) {
      this.handleError(socket, error, "likeError");
    }
  }

  async followUser(socket: Socket, data: { userId: string; followingId: string }): Promise<void> {
    try {
      await this.userService.handleFollow(socket, data.userId, data.followingId);
    } catch (error) {
      this.handleError(socket, error, "followError");
    }
  }

  async unfollowUser(socket: Socket, data: { userId: string; followingId: string }): Promise<void> {
    try {
      await this.userService.handleUnfollow(socket, data.userId, data.followingId);
    } catch (error) {
      this.handleError(socket, error, "unfollowError");
    }
  }

  async addComment(socket: Socket, data: { userId: string; postId: string; content: string }): Promise<void> {
    try {
      console.log(`💬 Comment added by ${data.userId} on Post ID: ${data.postId}   111`);
      await this.commentService.addComment(socket, data);
    } catch (error) {
      this.handleError(socket, error, "commentError");
    }
  }

  async deleteComment(socket: Socket, data: { userId: string; postId: string; commentId: string }): Promise<void> {
    try {
     
    } catch (error) {
      this.handleError(socket, error, "deleteCommentError");
    }
  }

  async likeComment(socket: Socket, data: { userId: string; postId: string; commentId: string }): Promise<void> {
    try {
     
    } catch (error) {
      this.handleError(socket, error, "likeCommentError");
    }
  }

 

  private handleError(socket: Socket, error: unknown, event: string) {
    console.error(`❌ ${event} Error:`, error instanceof Error ? error.message : error);
    socket.emit(event, { message: error instanceof Error ? error.message : "An unknown error occurred." });
  }
}
