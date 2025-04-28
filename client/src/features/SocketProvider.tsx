import React, { createContext, useEffect, useState, useContext } from "react";
import { socket } from "@/utils/Socket";
import useMessageStore from "@/appStore/useMessageStore";


interface SocketContextType {
  unreadNotifications: number;
  setUnreadNotifications: React.Dispatch<React.SetStateAction<number>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const handleNewNotification = (notification: any) => {
      console.log("📩 New Notification Received:", notification);
      setUnreadNotifications((prev) => prev + 1);
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, []);

  useEffect(() => {
    const handleMessage = (newMessage: any) => {
      const { currentlyOpenChatId, incrementUnreadCount } = useMessageStore.getState();
  
      // console.log("📩 Global listener: New message received:", newMessage);

      // console.log("📩 Global listener: Currently open chat ID:", currentlyOpenChatId);

      // console.log("📩 Global listener: newMessage i:",newMessage.chatId);
  
      if (newMessage.chatId !== currentlyOpenChatId) {
        incrementUnreadCount(newMessage.chatId);
      }
    };
  
    socket.on("chatUpdated", handleMessage);
  
    return () => {
      socket.off("chatUpdated", handleMessage);
    };
  }, []);
  
  return (
    <SocketContext.Provider value={{ unreadNotifications, setUnreadNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
