import React, { createContext, useEffect, useState, useContext } from "react";
import { socket } from "@/utils/Socket";

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
