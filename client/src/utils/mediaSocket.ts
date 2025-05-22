// src/sockets/mediaSocket.ts
import { io } from 'socket.io-client';

const MEDIA_SOCKET_URL = 'http://localhost:3010';

const mediaSocket = io(MEDIA_SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket'],
});

mediaSocket.on('connect', () => {
  console.log(
    `%c[${new Date().toISOString()}] 🎥 Connected to Media Socket.IO server (ID: ${
      mediaSocket.id
    })`,
    'color: green; font-weight: bold;',
  );
});

mediaSocket.on('disconnect', (reason) => {
  console.log(
    `%c[${new Date().toISOString()}] 📴 Media Socket disconnected. Reason: ${reason}`,
    'color: red; font-weight: bold;',
  );
});

mediaSocket.on('connect_error', (error) => {
  console.error(
    `%c[${new Date().toISOString()}] ⚠️ Media Socket connection error`,
    'color: orange; font-weight: bold;',
    error,
  );
});

export default mediaSocket;
