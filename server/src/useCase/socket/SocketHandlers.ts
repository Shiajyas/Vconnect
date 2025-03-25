import { Socket, Server } from "socket.io";
import { ISocketHandlers } from "./socketServices/Interface/ISocketHandlers";
import { IUserSocketService } from "./socketServices/Interface/IUserSocketService";
import { IPostSocketService } from "./socketServices/Interface/IPostSocketService";
import { INotificationService } from "../interfaces/InotificationService";
import { ICommentSocketService } from "./socketServices/Interface/ICommentSocketService";
import { IChatService } from "./socketServices/Interface/IChatService";

export class SocketHandlers implements ISocketHandlers {
  private io: Server;
  private notificationService: INotificationService;
  private userService: IUserSocketService;
  private postService: IPostSocketService;
  private commentService: ICommentSocketService;
  private chatService: IChatService

  constructor(
    private ioInstance: Server,
  
    notificationService: INotificationService,
    userService: IUserSocketService,
    postService: IPostSocketService,
    commentService: ICommentSocketService,
    chatService: IChatService
  ) {
    this.io = ioInstance;
    this.notificationService = notificationService;
    this.userService = userService;
    this.postService = postService;
    this.commentService = commentService;
    this.chatService = chatService
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

  async savePost(socket: Socket, postId: any, userId: string): Promise<void> {
    try {
      console.log(postId?.postId,"for>>>>>>>>>>>>> 2")
      await this.postService.savePost(socket, postId?.userId, postId?.postId);
    } catch (error) {
      this.handleError(socket, error, "likeError");
    }
  }

  async deletePost(socket: Socket, postId: any, userId: string): Promise<void>{
    try {
      await this.postService.deletePost(socket, postId?.postId, postId?.userId);
    } catch (error) {
      
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
      // console.log(`💬 Comment added by ${data.userId} on Post ID: ${data.postId}   111`);
      await this.commentService.addComment(socket, data);
    } catch (error) {
      this.handleError(socket, error, "commentError");
    }
  }

  async deleteComment(socket: Socket, data: { commentId: string }): Promise<void> {
    try {
     const {commentId} = data
     await this.commentService.deleteComment(socket,commentId)
    } catch (error) {
      this.handleError(socket, error, "deleteCommentError");
    }
  }

  async likeComment(socket: Socket, data: { userId: string;  commentId: string }): Promise<void> {
      try {
        const { userId, commentId } = data;
        await this.commentService.likeComment(socket, userId, commentId);
      } catch (error) {
        this.handleError(socket, error, "likeCommentError");
      }
    }

    async unLikeComment(socket: Socket, data: { userId: string; postId: string; commentId: string }): Promise<void> {
      try {
       const {userId,postId,commentId} = data
       await this.commentService.unLikeComment(socket,userId,commentId)
      } catch (error) {
        this.handleError(socket, error, "deleteCommentError");
      }
    }

    async sendMessage(socket: Socket, messageData: { _id: string; chatId: string; senderId: string; receiverId:string;  content: string; type: string; createdAt: string; replyTo?: string }): Promise<void> {
      try {
        const { _id, chatId, senderId, content, type, createdAt, replyTo } = messageData;
          if(!messageData.type){
            messageData.type = "text"
          }
        if (["text", "image", "video", "file"].includes(messageData.type)) {
          await this.chatService.sendMessage(socket, messageData.chatId, messageData.senderId, messageData);
        } else {
          throw new Error(`Invalid message type: ${messageData.type}`);
        }
      } catch (error) {
        this.handleError(socket, error, "messageError");
      }
    }

    async createChat(socket: Socket, senderId: string, receiverId: string){
      try {
        console.log(senderId,receiverId,"for>>>>>>>>>>>>> 2")
        await this.chatService.createChat(socket,senderId,receiverId)
      } catch (error) {
        
      }
    }
  async getChats(socket: Socket, userId: { userId: string }): Promise<void> {
    try {
      await this.chatService.getUserChats(socket, userId);
    } catch (error) {
      this.handleError(socket, error, "getChatsError");
    }
  }

  async getMessages(socket: Socket,chatId: string, page: number, limit: number ): Promise<void> {
    try {
      await this.chatService.getMessages(socket, chatId, page, limit);
    } catch (error) {
      this.handleError(socket, error, "loadMessagesError");
    }
  }


  private handleError(socket: Socket, error: unknown, event: string) {
    console.error(`❌ ${event} Error:`, error instanceof Error ? error.message : error);
    socket.emit(event, { message: error instanceof Error ? error.message : "An unknown error occurred." });
  }
}
