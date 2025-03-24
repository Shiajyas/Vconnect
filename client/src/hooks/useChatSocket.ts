import { useState, useEffect } from "react";
import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/context/AuthContext";
import { socket } from "@/utils/Socket";

interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: "text" | "image" | "video";
  createdAt: string;
  replyTo?: Message;
}

interface Chat {
  _id: string;
  members: string[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}

const MESSAGE_LIMIT = 20;

export const useChatSocket = (selectedChatId: string | null) => {
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
 
  const userId = user?._id || null;

  // **Infinite Query for Messages**
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<Message[], Error>({
    queryKey: ["messages", selectedChatId],
    queryFn: ({ pageParam = 0 }: { pageParam?: unknown }) =>
      new Promise<Message[]>((resolve) => {
        if (!selectedChatId || !socket) return resolve([]);

        const page = typeof pageParam === "number" ? pageParam : 0;
        socket.emit("loadMessages", { chatId: selectedChatId, page, limit: MESSAGE_LIMIT });

        const handleMessages = ({ messages }: { messages: Message[] }) => {
          resolve(messages);
          socket.off("chatMessages", handleMessages);
        };

        socket.on("chatMessages", handleMessages);
      }),
    getNextPageParam: (lastPage: Message[], pages: Message[][]) =>
      lastPage.length === MESSAGE_LIMIT ? pages.length : undefined,
    initialPageParam: 0,
    enabled: !!selectedChatId,
  });

  const messages = data?.pages.flat() || [];

  // **Real-time Message Listener**
  useEffect(() => {
    if (!socket || !selectedChatId) return;

    const handleReceiveMessage = (message: Message) => {
      if (message.chatId === selectedChatId) {
        queryClient.setQueryData(["messages", selectedChatId], (old: { pages: Message[][] } | undefined) => {
          return old
            ? { pages: [[message, ...(old.pages[0] || [])], ...old.pages.slice(1)] }
            : { pages: [[message]] };
        });
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [selectedChatId, socket, queryClient]);

  // **Typing Indicator**
  useEffect(() => {
    if (!socket || !selectedChatId) return;

    const handleTyping = (chatId: string) => {
      if (chatId === selectedChatId) {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
      }
    };

    socket.on("userTyping", handleTyping);

    return () => {
      socket.off("userTyping", handleTyping);
    };
  }, [selectedChatId, socket]);

  // **Online Users Update**
  useEffect(() => {
    if (!socket) return;

    socket.on("updateOnlineUsers", setOnlineUsers);

    return () => {
      socket.off("updateOnlineUsers", setOnlineUsers);
    };
  }, [socket]);

  // **Send Message**
  const sendMessage = (message: string, chatId: string, receiverId: string, replyTo?: Message) => {
    if (!socket || !chatId || !userId || !receiverId) return;

    const newMessage: Omit<Message, "_id"> = {
      chatId,
      senderId: userId,
      receiverId,
      content: message,
      type: "text",
      createdAt: new Date().toISOString(),
      replyTo,
    };

    socket.emit("sendMessage", newMessage);
  };

  // **Emit Typing Event**
  const handleTyping = (chatId: string) => {
    if (!socket || !chatId) return;
    socket.emit("typing", { chatId, userId });
  };

  // **Handle New Chat Creation**
  const createChatWithUser = (receiverId: string) => {
    if (!socket || !userId) return;

    socket.emit("createChat", { senderId: userId, receiverId });
  };

  // **Listen for Chat Creation**
  useEffect(() => {
    if (!socket) return;

    const handleNewChat = (newChat: Chat) => {
      setChats((prevChats) => [newChat, ...prevChats]);
    };

    socket.on("chatCreated", handleNewChat);

    return () => {
      socket.off("chatCreated", handleNewChat);
    };
  }, [socket]);

  return {
    messages,
    typing,
    onlineUsers,
    sendMessage,
    handleTyping,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    createChatWithUser,
    chats,
    setChats,
  };
};
