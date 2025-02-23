import { Server, Socket } from "socket.io";
import { SocketHandlers } from "../../useCase/socketHandlers";
import { SUserRepositoryImpl } from "../../data/repositories/SUserRepositoryImpl";
import { NotificationServiceImpl } from "../services/NotificationServiceImpl";
import { UserRepository } from "../../data/repositories/userRepository";
import { createServer } from "http";

// Instantiate repositories and services
const userRepository = new SUserRepositoryImpl();
const notificationService = new NotificationServiceImpl();
const mainUserRepository = new UserRepository();

let io: Server | null = null; // Ensure it's initialized properly

/**
 * Initialize Socket.IO with an HTTP server
 * @param server - The HTTP server instance
 */
export const initializeSocket = (server: ReturnType<typeof createServer>) => {
  if (io) {
    console.warn("⚠️ Socket.IO is already initialized!");
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins (adjust for production)
      methods: ["GET", "POST", "PUT", "PATCH"],
    },
  });

  const socketHandlers = new SocketHandlers(io, userRepository, mainUserRepository, notificationService);

  io.on("connection", (socket: Socket) => {
    console.log(`[${new Date().toISOString()}] 🔌 New client connected: ${socket.id}`);

    // Assign event handlers
    socket.on("joinUser", (id) => socketHandlers.joinUser(socket, id));
    socket.on("joinAdmin", (id) => socketHandlers.joinAdmin(socket, id));
 
    // ✅ Handle Follow & Unfollow
    socket.on("follow", (data) => socketHandlers.followUser(socket, data));
    socket.on("unfollow", (data) => socketHandlers.unfollowUser(socket, data));

    socket.on("postUploaded", (data) => socketHandlers.postUploaded(socket, userId,PostId));

    socket.on("disconnect", () => {
      console.log(`[${new Date().toISOString()}] ❌ Client disconnected: ${socket.id}`);
    });
  });

  console.log("✅ Socket.IO initialized and ready to accept connections.");
};

/**
 * Get the Socket.IO instance after initialization
 * @returns The Socket.IO server instance
 * @throws Error if Socket.IO is not initialized
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error("❌ Socket.IO is not initialized! Call initializeSocket first.");
  }
  return io;
};
