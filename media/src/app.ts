import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { setupRedisAdapter } from './config/redis.config';
import { setupMediasoup } from './config/mediasoup.config';
import { registerSocketHandlers } from './routes/socket.routes';
import { ClientToServerEvents, ServerToClientEvents } from './types/socket.types';

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>  (httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Setup Redis adapter for Socket.IO
setupRedisAdapter(io);

(async () => {
  // Setup Mediasoup
  await setupMediasoup();

  // Register socket handlers
  io.on('connection', (socket) => {
    registerSocketHandlers(io, socket);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
