import { io } from 'socket.io-client';
import useNotificationStore from '@/store/notificationStore'; // Import the store
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket'],
});


// Log when connected
socket.on('connect', () => {
  console.log(
    `%c[${new Date().toISOString()}] ✅ Connected to Socket.IO server with ID: ${socket.id}`,
    'color: green; font-weight: bold;',
  );
});

// Log when disconnected
socket.on('disconnect', (reason) => {
  console.log(
    `%c[${new Date().toISOString()}] ❌ Disconnected from Socket.IO. Reason: ${reason}`,
    'color: red; font-weight: bold;',
  );
});

// Log connection errors
socket.on('connect_error', (error) => {
  console.error(
    `%c[${new Date().toISOString()}] ⚠️ Connection error`,
    'color: orange; font-weight: bold;',
    error,
  );
});

// Listen for new notifications and update the store
socket.on('newNotification', (notification) => {
  try {
    console.log(
      `%c[${new Date().toISOString()}] 📩 New Notification Received`,
      'color: cyan; font-weight: bold;',
    );
    console.log('🔔 Notification Details:', notification);

    // Update Zustand store
    useNotificationStore.getState().incrementUnreadCount();
    toast.success(notification.message);
  } catch (error) {
    console.error(
      `%c[${new Date().toISOString()}] ❌ Error processing notification`,
      'color: red; font-weight: bold;',
    );
    console.error(error);
  }
});
