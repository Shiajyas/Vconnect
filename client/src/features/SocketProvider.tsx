import React, { createContext, useEffect, useState, useContext } from 'react';
import { socket } from '@/utils/Socket';
import { chatSocket } from '@/utils/chatSocket';
import useMessageStore from '@/appStore/useMessageStore';

interface SocketContextType {
  unreadNotifications: number;
  setUnreadNotifications: React.Dispatch<React.SetStateAction<number>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const handleNewNotification = (notification: any) => {
      console.log('📩 New Notification Received:', notification);
      setUnreadNotifications((prev) => prev + 1);
    };

    socket.on('newNotification', handleNewNotification);
    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, []);

  useEffect(() => {
    const handleMessage = (newMessage: any) => {
      const { currentlyOpenChatId, incrementUnreadCount } = useMessageStore.getState();
      console.log('📩 Global: New message received:', newMessage);

      if (newMessage.chatId !== currentlyOpenChatId) {
        incrementUnreadCount(newMessage.chatId);
      }
    };

    // ✅ Correct event name
    socket.on("chatUpdated", handleMessage);
    return () => {
    socket.off("chatUpdated", handleMessage);
    };
  }, []);


  useEffect(() => {
socket.onAny((event, ...args) => {
    console.log(`[📡 GlobalSocket] Event: ${event}`, args);
  });
}, []);


  return (
    <SocketContext.Provider value={{ unreadNotifications, setUnreadNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
