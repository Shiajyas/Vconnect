import { useState, useEffect } from "react";
import { socket } from "@/utils/Socket";

interface Chat {
  _id: string;
  members: string[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}

export const useChat = (chatId: string | null) => {
 
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  // **Create a Chat with a User**
  const createChatWithUser = (userId: string, selectedUserId: string) => {
    if (!socket) return;

    // Check if chat already exists
    const existingChat = chats.find(
      (chat) => chat.members.includes(selectedUserId) && !chat.isGroup
    );

    if (existingChat) {
      setSelectedChat(existingChat);
      return;
    }

    // Emit createChat event to backend
    socket.emit("createChat", { senderId: userId, receiverId: selectedUserId });
  };

  // **Listen for chatCreated event**
  useEffect(() => {
    if (!socket) return;

    const handleNewChat = (newChat: Chat) => {
      setChats((prevChats) => [newChat, ...prevChats]); // Add new chat to state
      setSelectedChat(newChat);
    };

    socket.on("chatCreated", handleNewChat);

    return () => {
      socket.off("chatCreated", handleNewChat);
    };
  }, [socket]);

  return {
    chats,
    selectedChat,
    setSelectedChat,
    createChatWithUser,
  };
};
