import { io } from 'socket.io-client';
import 'react-toastify/dist/ReactToastify.css';
import { useUserAuth } from '@/hooks/useUserAuth';

const SOCKET_URL = 'http://localhost:3011';



export const chatSocket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket'],
});

// When connected
chatSocket.on('connect', () => {
  console.log(
    `%c[${new Date().toISOString()}] ✅ Connected to Socket.IO Chat server with ID: ${chatSocket.id}`,
    'color: green; font-weight: bold;',
  );

  // ✅ Emit chatSocketId update after connection is established
  
});

// When disconnected
chatSocket.on('disconnect', (reason) => {
  console.log(
    `%c[${new Date().toISOString()}] ❌ Disconnected from Chat Socket.IO. Reason: ${reason}`,
    'color: red; font-weight: bold;',
  );
});

// On connection error
chatSocket.on('connect_error', (error) => {
  console.error(
    `%c[${new Date().toISOString()}] ⚠️ Connection error`,
    'color: orange; font-weight: bold;',
    error,
  );
});
