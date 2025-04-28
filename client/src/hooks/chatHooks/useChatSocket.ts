import { useEffect, useState, useCallback } from "react";
import { socket } from "@/utils/Socket";
import { useQueryClient } from "@tanstack/react-query";
import { NormalizedChat } from "@/utils/normalizeChat";

interface Message {
  _id: string;
  senderId: string;
  content: string;
  replyTo?: Message | null;
  createdAt?: string;
}

const MESSAGES_PER_PAGE = 20;

const normalizeMessage = (message: any): Message => ({
  _id: message._id || Date.now().toString(),
  senderId: message.senderId,
  content: message.content || "",
  replyTo: message.replyTo || null,
  createdAt: message.createdAt || new Date().toISOString(),
});

const useChatSockets = (chatId: string, userId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;

    // Reset state when chatId changes
    setMessages([]);
    setPage(0);
    setHasMore(true);
    setLoading(false);

    console.log("🔄 Joining chat room:", chatId);

    socket.emit("leaveChat", chatId);
    socket.emit("joinChat", chatId);
    fetchMessages();

    const handleMessagesFetched = ({ messages: newMessages }: { messages: Message[] }) => {
      setLoading(false);
      if (newMessages.length < MESSAGES_PER_PAGE) setHasMore(false);

      setMessages((prev) => {
        const uniqueMessages = new Map(prev.map((msg) => [msg._id, msg]));
        newMessages.forEach((msg) => uniqueMessages.set(msg._id, msg));
        return Array.from(uniqueMessages.values()).sort(
          (b,a) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
        );
      });
    };

    const handleMessageReceived = (newMessage: any) => {
      console.log("💬 useChatSockets: Message in active chat:", newMessage);
    
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMessage._id)) return prev;
        return [newMessage, ...prev];
      });
    
      // Update lastMessage in the chat list
      queryClient.setQueryData(["chats", userId], (prevChats: NormalizedChat[] = []) => {
        if (!Array.isArray(prevChats)) return [];
    
        const chatIndex = prevChats.findIndex((chat) => chat._id === newMessage.chatId);
    
        let updatedChats = [...prevChats];
    
        if (chatIndex > -1) {
          const updatedChat = { ...updatedChats[chatIndex], lastMessage: newMessage };
          updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(updatedChat);
        } else {
          updatedChats.unshift({
            _id: newMessage.chatId,
            lastMessage: newMessage,
            participants: [],
          });
        }
    
        return updatedChats;
      });
    };
      

    const handleMessageDeleted = (messageId: string) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    };

    const handleMessageEdited = (updatedMessage: Message) => {
      console.log("Received Edited Message:", updatedMessage);
    
   
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
      );
    
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats", chatId] });
    };
    
    const handleUserTyping = ({ senderId }: { senderId: string }) => {
      if (senderId !== userId) {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
      }
    };

    // Remove previous listeners
    socket.off("messagesFetched", handleMessagesFetched);
    socket.off("messageReceived", handleMessageReceived);
    socket.off("messageDeleted", handleMessageDeleted);
    socket.off("messageEdited", handleMessageEdited);
    socket.off("userTyping", handleUserTyping);

    // Add event listeners
    socket.on("messagesFetched", handleMessagesFetched);
    socket.on("messageReceived", handleMessageReceived);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("userTyping", handleUserTyping);

    return () => {
      socket.emit("leaveChat", chatId);
      socket.off("messagesFetched", handleMessagesFetched);
      socket.off("messageReceived", handleMessageReceived);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("userTyping", handleUserTyping);
    };
  }, [chatId]);

  const fetchMessages = useCallback(() => {
    if (!hasMore || loading) return;
    setLoading(true);
    socket.emit("fetchMessages", { chatId, page, limit: MESSAGES_PER_PAGE });
    setPage((prev) => prev + 1);
  }, [chatId, hasMore, loading, page]);

  return {
    messages,
    sendMessage: (message: string, replyTo?: Message | null) => {
      if (!message.trim()) return;
      const newMessage = normalizeMessage({ senderId: userId, content: message, replyTo });

      setMessages((prev) => [...prev, newMessage]);
      socket.emit("sendMessage", { chatId, message, senderId: userId, replyTo });
    },
    fetchMessages,
    hasMore,
    typing,
    loading,
    editMessage: (messageId: string, newContent: string) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, content: newContent } : msg
        )
      );
      socket.emit("editMessage", { chatId, messageId, newContent });
    },
    deleteMessage: (messageId: string) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      socket.emit("deleteMessage", { chatId, messageId });
    },
    handleTyping: () => {
      socket.emit("typing", { chatId, senderId: userId });
    },
  };
};

export default useChatSockets;
