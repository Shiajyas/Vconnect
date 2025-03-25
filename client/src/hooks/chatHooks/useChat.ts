import { useState, useEffect } from "react";
import { socket } from "@/utils/Socket";
import { NormalizedChat } from "@/utils/normalizeChat";
import { normalizeChat } from "@/utils/normalizeChat";

export const useChat = (userId: string | null) => {
  const [chats, setChats] = useState<NormalizedChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<NormalizedChat | null>(null);

  const createChatWithUser = (selectedUserId: string): Promise<NormalizedChat | null> => {
    return new Promise((resolve) => {
      if (!socket || !userId || !selectedUserId) return resolve(null);

      socket.emit("createChat", { senderId: userId, receiverId: selectedUserId }, (response: any) => {
        if (response?.error) {
          console.error("❌ Chat creation failed:", response.error);
          return resolve(null);
        }
        resolve(normalizeChat(response.chat.chat));
      });
    });
  };

  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewChat = (newChat: any) => {
      const normalizedChat = normalizeChat(newChat.chat);

      setChats((prevChats) => {
        if (prevChats.some((chat) => chat._id === normalizedChat._id)) return prevChats;
        return [normalizedChat, ...prevChats];
      });

      setSelectedChat((prevChat) => (prevChat?._id === normalizedChat._id ? prevChat : normalizedChat));
    };

    socket.on("chatCreated", handleNewChat);
    return () => {
      socket.off("chatCreated", handleNewChat);
    };
  }, [userId]);

  return { chats, setChats, selectedChat, setSelectedChat, createChatWithUser };
};
