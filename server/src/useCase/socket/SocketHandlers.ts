import { Socket, Server } from "socket.io";
import { ISocketHandlers } from "./socketServices/Interface/ISocketHandlers";
import { IUserSocketService } from "./socketServices/Interface/IUserSocketService";
import { IPostSocketService } from "./socketServices/Interface/IPostSocketService";
import { INotificationService } from "../interfaces/InotificationService";
import { ISUserRepository } from "../../data/interfaces/ISUserRepository";
import { IUserRepository } from "../../data/interfaces/IUserRepository";
import { IPostRepository } from "../../data/interfaces/IPostRepository";
import { ICommentRepository } from "../../data/interfaces/ICommentRepository";

export class SocketHandlers implements ISocketHandlers {
  private io: Server;
  private notificationService: INotificationService;
  private userService: IUserSocketService;
  private postService: IPostSocketService;

  constructor(
    private ioInstance: Server,
    private userRepository: ISUserRepository,
    private mainUserRepository: IUserRepository,
    private postRepository: IPostRepository,
    private commentRepository: ICommentRepository,
    notificationService: INotificationService,
    userService: IUserSocketService,
    postService: IPostSocketService
  ) {
    this.io = ioInstance;
    this.notificationService = notificationService;
    this.userService = userService;
    this.postService = postService;
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

 

  private handleError(socket: Socket, error: unknown, event: string) {
    console.error(`❌ ${event} Error:`, error instanceof Error ? error.message : error);
    socket.emit(event, { message: error instanceof Error ? error.message : "An unknown error occurred." });
  }
}
