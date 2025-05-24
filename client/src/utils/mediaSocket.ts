// src/utils/mediaSocket.ts
import { io, Socket } from 'socket.io-client';

const MEDIA_SOCKET_URL = 'http://localhost:3000';

let mediaSocket: Socket;

const createMediaSocket = () => {
  const socket = io(MEDIA_SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log(
      `%c[${new Date().toISOString()}] 🎥 Connected to Media Socket.IO server (ID: ${
        socket.id
      })`,
      'color: green; font-weight: bold;',
    );
  });
    
  socket.on('disconnect', (reason) => {
    console.log(
      `%c[${new Date().toISOString()}] 📴 Media Socket disconnected. Reason: ${reason}`,
      'color: red; font-weight: bold;',
    );
  });

  socket.on('connect_error', (error) => {
    console.error(
      `%c[${new Date().toISOString()}] ⚠️ Media Socket connection error`,
      'color: orange; font-weight: bold;',
      error,
    );
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(
      `%c[${new Date().toISOString()}] 🔄 Media Socket reconnected after ${attemptNumber} attempts`,
      'color: blue; font-weight: bold;',
    );
  });

  socket.on('reconnect_error', (error) => {
    console.error(
      `%c[${new Date().toISOString()}] ❌ Media Socket reconnection failed`,
      'color: red; font-weight: bold;',
      error,
    );
  });

  return socket;
};

// Create the socket instance
mediaSocket = createMediaSocket();

// Helper function to ensure socket is connected
export const ensureMediaSocketConnection = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (mediaSocket.connected) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('Media socket connection timeout'));
    }, 10000);

    mediaSocket.once('connect', () => {
      clearTimeout(timeout);
      resolve();
    });

    mediaSocket.once('connect_error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    if (!mediaSocket.connected) {
      mediaSocket.connect();
    }
  });
};

// Helper function to safely emit events
export const safeEmit = (event: string, data?: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!mediaSocket.connected) {
      reject(new Error('Media socket not connected'));
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error(`Emit timeout for event: ${event}`));
    }, 10000);

    if (data !== undefined) {
      mediaSocket.emit(event, data, (response: any) => {
        clearTimeout(timeout);
        resolve(response);
      });
    } else {
      mediaSocket.emit(event, (response: any) => {
        clearTimeout(timeout);
        resolve(response);
      });
    }
  });
};

export default mediaSocket;
