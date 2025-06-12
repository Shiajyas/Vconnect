import { Server, Socket } from 'socket.io';
import { createServer } from 'http';

import { UserRepository } from '../../data/repositories/userRepository';
import { SUserRepositoryImpl } from '../../data/repositories/SUserRepositoryImpl';
import { ChatRepository } from '../../data/repositories/ChatRepository';
import { CallHistoryRepository } from '../../data/repositories/CallHistoryRepository';
import { UserSocketService } from '../../useCase/socket/socketServices/userSocketService';

import { ChatService } from '../../useCase/socket/socketServices/ChatService';
import { CallSocketService } from '../../useCase/socket/CallSocketService';

import { chatHandlers } from './socketHandlers/chatHandlers';
import { callHandlers } from './socketHandlers/callHandlers';
import { userHandlers } from './socketHandlers/userHandlers';


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
  const chatRepository = new ChatRepository();
  const callHistoryRepository = new CallHistoryRepository();



  const chatService = new ChatService(chatRepository, mainUserRepository, io);

  const callSocketService = new CallSocketService(
    mainUserRepository,
    userRepository,
    callHistoryRepository,
  );

    const userSocketService = new UserSocketService(
    io,
    userRepository,
    mainUserRepository,

  );

  // Handle socket connection
io.on('connection', async (socket: Socket) => {
    const users = await mainUserRepository.getActiveUsers();
  console.log('users***',);

  console.log(
    `[${new Date().toISOString()}] 🔌 Client connected:2 ${socket.id}`,
  );


  socket.emit('onlineUsers', { users });

  userHandlers(socket, userSocketService);
  chatHandlers(socket, chatService);
  callHandlers(socket, callSocketService);
  

  socket.on('disconnect', () => {
    console.log(
      `[${new Date().toISOString()}] ❌ Client disconnected: ${socket.id}`,
    );
  });
});


  console.log('✅ Socket.IO initialized and ready.');
};
