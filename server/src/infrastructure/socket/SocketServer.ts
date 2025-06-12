import { Server, Socket } from 'socket.io';
import { createServer } from 'http';

// Repositories
import { UserRepository } from '../../data/repositories/userRepository';
import { SUserRepositoryImpl } from '../../data/repositories/SUserRepositoryImpl';
import { PostRepository } from '../../data/repositories/PostRepository';
import { CommentRepository } from '../../data/repositories/CommentRepository';
import { ChatRepository } from '../../data/repositories/ChatRepository';
import { CallHistoryRepository } from '../../data/repositories/CallHistoryRepository';

// Services
import { NotificationService } from '../../useCase/notificationService';
import { UserSocketService } from '../../useCase/socket/socketServices/userSocketService';
import { PostSocketService } from '../../useCase/socket/socketServices/postSocketService';
import { CommentSocketService } from '../../useCase/socket/socketServices/CommentSocketService';
import { AdminSocketService } from '../../useCase/socket/socketServices/adminSocketService';
import { AdminOverviewService } from '../../useCase/AdminOverviewService';
import { ReportRepository } from '../../data/repositories/ReportRepository';

// Handlers
import { postHandlers } from './socketHandlers/postHandlers';
import { commentHandlers } from './socketHandlers/commentHandlers';
import { userHandlers } from './socketHandlers/userHandlers';
import { adminHandlers } from './socketHandlers/adminHandlers';

let io: Server | null = null;

export const initializeSocket = (
  server: ReturnType<typeof createServer>,
): Server | void => {
  if (io) {
    console.warn('⚠️ Socket.IO already initialized!');
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3001',
        'http://192.168.1.7:3001', // Frontend IP
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH'],
      credentials: true,
    },
  });

  // Instantiate repositories
  const userRepository = new UserRepository();
  const mainUserRepository = new SUserRepositoryImpl();
  const postRepository = new PostRepository();
  const commentRepository = new CommentRepository();
  const chatRepository = new ChatRepository();
  const callHistoryRepository = new CallHistoryRepository();
  const reportRepository = new ReportRepository();

  // Instantiate services
  const notificationService = new NotificationService(
    io,
    mainUserRepository,
    userRepository,
  );
  const postSocketService = new PostSocketService(
    io,
    userRepository,
    postRepository,
    notificationService,
  );
  const commentSocketService = new CommentSocketService(
    io,
    commentRepository,
    userRepository,
    notificationService,
    postRepository,
  );
  const adminSocketService = new AdminSocketService(
    io,
    new AdminOverviewService(),
    mainUserRepository,
    reportRepository,
    notificationService,
  );
  const userSocketService = new UserSocketService(
    io,
    userRepository,
    mainUserRepository,
    notificationService,
    adminSocketService,
  );

  // Handle socket connection
  io.on('connection', (socket: Socket) => {
    console.log(
      `[${new Date().toISOString()}] 🔌 Client connected: ${socket.id}`,
    );

    socket.emit('onlineUsers', { users:  mainUserRepository.getActiveUsers() });

    // console.log("onlineUsers8888", mainUserRepository.getActiveUsers());
    // Register socket event handlers
    userHandlers(socket, userSocketService);
    postHandlers(socket, postSocketService);
    commentHandlers(socket, commentSocketService);
    adminHandlers(socket, adminSocketService); //

    socket.on('disconnect', () => {
      console.log(
        `[${new Date().toISOString()}] ❌ Client disconnected: ${socket.id}`,
      );
    });
  });

  console.log('✅ Socket.IO initialized and ready.');
};
