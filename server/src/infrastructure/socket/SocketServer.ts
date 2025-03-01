import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { SocketHandlers } from "../../useCase/socket/SocketHandlers";
import { SUserRepositoryImpl } from "../../data/repositories/SUserRepositoryImpl";
import { NotificationService } from "../../useCase/notificationService";
import { UserRepository } from "../../data/repositories/userRepository";
import { PostRepository } from "../../data/repositories/PostRepository";
import { CommentRepository } from "../../data/repositories/CommentRepository";
import { IUserSocketService } from "../../useCase/socket/socketServices/Interface/IUserSocketService";
import { IPostSocketService } from "../../useCase/socket/socketServices/Interface/IPostSocketService";
import { UserSocketService } from "../../useCase/socket/socketServices/userSocketService";
import { PostSocketService } from "../../useCase/socket/socketServices/postSocketService";
import { INotificationService } from "../../useCase/interfaces/InotificationService";
import { ISUserRepository } from "../../data/interfaces/ISUserRepository";
import { IUserRepository } from "../../data/interfaces/IUserRepository";
import { IPostRepository } from "../../data/interfaces/IPostRepository";
import { ICommentRepository } from "../../data/interfaces/ICommentRepository";
import { ICommentSocketService } from "../../useCase/socket/socketServices/Interface/ICommentSocketService";
import { CommentSocketService } from "../../useCase/socket/socketServices/CommentSocketService";

// Instantiate repositories
const userRepository: IUserRepository = new UserRepository();
const mainUserRepository: ISUserRepository = new SUserRepositoryImpl();
const postRepository: IPostRepository = new PostRepository();
const commentRepository: ICommentRepository = new CommentRepository();

let io: Server | null = null; // Ensure proper initialization
let notificationService: NotificationService; // Declare without initialization

export const initializeSocket = (server: ReturnType<typeof createServer>) => {
  if (io) {
    console.warn("⚠️ Socket.IO is already initialized!");
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH"],
    },
  });

  // Initialize Notification Service AFTER io is set up
  notificationService = new NotificationService(io, mainUserRepository);

  // Now initialize socket services since notificationService is available
  const userSocketService: IUserSocketService = new UserSocketService(
    io,
    userRepository,
    mainUserRepository,
    notificationService
  );

  const postSocketService: IPostSocketService = new PostSocketService(
    io,
    userRepository,
    postRepository,
    notificationService
  );

  const commentSocketService: ICommentSocketService = new CommentSocketService(
    io,
    commentRepository,
    userRepository,
    notificationService,
    postRepository
  )

  const socketHandlers = new SocketHandlers(
    io,
    notificationService,
    userSocketService,
    postSocketService,
    commentSocketService
   
  );

  io.on("connection", (socket: Socket) => {
    console.log(`[${new Date().toISOString()}] 🔌 New client connected: ${socket.id}`);

    socket.on("joinUser", (id) => socketHandlers.joinUser(socket, id));

    socket.on("joinPostRoom", (postId) => {
      socket.join(postId);
      console.log(`[${socket.id}] joined post room: ${postId}`);
    });

    socket.on("postUploaded", (data) => {
      const { userId, postId } = data;
      socketHandlers.postUploaded(socket, userId, postId);
    });

    socket.on("like_post", (data) => {
      const { userId, postId, type } = data;
      socketHandlers.likePost(socket, userId, postId, type);
    });

    socket.on("followUser", (data) => {
      console.log(`💬 Comment added by ${data.userId} on Post ID: ${data.postId}123`);
        
      socketHandlers.followUser(socket, data);
    });

    socket.on("unfollowUser", (data) => {
      socketHandlers.unfollowUser(socket, data);
    });

    socket.on("addComment", async (data) => {
      try {
        // console.log(`💬 Comment added by ${data.userId} on Post ID: ${data.postId}123`);
        
        await socketHandlers.addComment(socket, data);
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    });

    socket.on("deleteComment", async (data) => {
      try {
        await socketHandlers.deleteComment(socket, data);
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    });

    socket.on("likeComment", async (data) => {
      try {
        await socketHandlers.likeComment(socket, data);
      } catch (error) {
        console.error("Error liking comment:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[${new Date().toISOString()}] ❌ Client disconnected: ${socket.id}`);
    });
  });

  console.log("✅ Socket.IO initialized and ready to accept connections.");
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("❌ Socket.IO is not initialized! Call initializeSocket first.");
  }
  return io;
};
