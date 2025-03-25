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
import { ISUserRepository } from "../../data/interfaces/ISUserRepository";
import { IUserRepository } from "../../data/interfaces/IUserRepository";
import { IPostRepository } from "../../data/interfaces/IPostRepository";
import { ICommentRepository } from "../../data/interfaces/ICommentRepository";
import { ICommentSocketService } from "../../useCase/socket/socketServices/Interface/ICommentSocketService";
import { CommentSocketService } from "../../useCase/socket/socketServices/CommentSocketService";
import { IChatService } from "../../useCase/socket/socketServices/Interface/IChatService";
import { ChatService } from "../../useCase/socket/socketServices/ChatService";
import IChatRepository from "../../data/interfaces/IChatRepository";
import { ChatRepository } from "../../data/repositories/ChatRepository";

// Instantiate repositories
const userRepository: IUserRepository = new UserRepository();
const mainUserRepository: ISUserRepository = new SUserRepositoryImpl();
const postRepository: IPostRepository = new PostRepository();
const commentRepository: ICommentRepository = new CommentRepository();

let io: Server | null = null; // Ensure proper initialization
let notificationService: NotificationService; // Declare without initialization
const chatRepository: IChatRepository = new ChatRepository();

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
  notificationService = new NotificationService(io, mainUserRepository,userRepository);
  const chatService: IChatService = new ChatService(chatRepository, io);

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
    commentSocketService,
    chatService
   
  );


  io.on("connection", (socket: Socket) => {
    console.log(`[${new Date().toISOString()}] 🔌 New client connected: ${socket.id}`);

    socket.removeAllListeners("joinChat");
    socket.removeAllListeners("leaveChat");
    socket.removeAllListeners("sendMessage");
  

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
        console.log(`💬 Comment added by ${data.userId} on Post ID: ${data.postId}123`);
        
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

    socket.on("unLikeComment", async (data) => {
      try {
        await socketHandlers.unLikeComment(socket, data);
      } catch (error) {
        console.error("Error liking comment:", error);
      }
    });

    socket.on("savePost",async(postId,userId)=>{
      try {
        await socketHandlers.savePost(socket,postId,userId)
      } catch (error) {
        console.error("Error liking comment:", error);
      }
    })

    socket.on("deletePost",async(postId,userId)=>{
      try {
        console.log(postId,userId,"for>>>>>>>>>>>>> 1")
        await socketHandlers.deletePost(socket,postId,userId)
     
      } catch (error) {
        console.error("Error liking comment:", error);
      }
    })

    socket.on("userOnline", (userId) => {
      console.log(`User ${userId} is online`);
      socket.emit("updateOnlineUsers", userId);
    });

    socket.on("createChat", async({ senderId, receiverId }) => {
      console.log(`User ${senderId} is create in chat: ${receiverId}`);
      try {
        await socketHandlers.createChat(socket, senderId, receiverId);
      } catch (error) {
        console.log(error)
      }
    });
    
    socket.on("getChats", async (userId) => {
      try {
        console.log("getChats", userId);
        await socketHandlers.getChats(socket, userId);
      } catch (error) {
        console.error("Error getChats:", error);
      }
    });

    socket.on("fetchMessages", async ({ chatId, page, limit }) => {
      try {
        console.log("fetchMessages", chatId, page, limit);
        const messages = await socketHandlers.getMessages(socket,chatId, page, limit);

        console.log("hited fetchMessages")
     
      } catch (error) {
        console.error("Error fetching messages:", error);
        socket.emit("error", { message: "Failed to fetch messages" });
      }
    });

    
    socket.on("sendMessage",async(newMessage)=>{
      try {
        console.log(newMessage,"for>>>>>>>>>>>>> 1")
        await socketHandlers.sendMessage(socket,newMessage)
       
      } catch (error) {
        console.error("Error liking comment:", error);
      }
    })


 socket.on("typing", ({ chatId, senderId }) => {
  console.log("typing", chatId, senderId);
  socket.to(chatId).emit("userTyping", { senderId });
});

const chatRooms = new Map(); // Store active socket rooms

socket.on("joinChat", async(chatId) => {
  const existingRoom = chatRooms.get(socket.id);
  if (existingRoom === chatId) return; // Prevent duplicate joins

  console.log(`[${socket.id}] joining chat room: ${chatId}`);
  chatRooms.set(socket.id, chatId);

  socket.join(chatId);
 
  console.log(`[${socket.id}] joined chat room: ${chatId}`);
//  await socketHandlers.getMessages(socket,chatId, 1, 20);
});

socket.on("leaveChat", (chatId) => {
  console.log(`[${socket.id}] leaving chat room: ${chatId}`);
  socket.leave(chatId);
  chatRooms.delete(socket.id);
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
