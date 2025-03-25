import { useEffect, useState, useCallback } from "react";
import { socket } from "@/utils/Socket";

interface Message {
  _id: string;
  senderId: string;
  content: string;
  createdAt?: string;
}

const MESSAGES_PER_PAGE = 20;

const normalizeMessage = (message: any): Message => ({
  _id: message._id || Date.now().toString(),
  senderId: message.senderId,
  content: message.content || "",
  createdAt: message.createdAt || new Date().toISOString(),
});

const useChatSockets = (chatId: string, userId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chatId) return;
  
    setMessages([]);
    setPage(0);
    setHasMore(true);
    setLoading(false);
  
    console.log("🔄 Joining chat room:", chatId);
  
    // Ensure the socket leaves the previous chat before joining a new one
    socket.emit("leaveChat", chatId);
    socket.emit("joinChat", chatId);
    fetchMessages();
  
    const handleMessagesFetched = ({ messages: newMessages }) => {
      // console.log("📥 Received messages:", newMessages);
      setLoading(false);
  
      if (newMessages.length < MESSAGES_PER_PAGE) setHasMore(false);
  
      const normalizedMessages = newMessages.map(normalizeMessage);
  
      setMessages((prev) => {
        const uniqueMessages = new Map(prev.map((msg) => [msg._id, msg]));
        newMessages.forEach((msg) => uniqueMessages.set(msg._id, msg));
        return Array.from(uniqueMessages.values()); // Ensure unique messages
      });
    };
  
    const handleMessageReceived = (newMessage: any) => {
      console.log("📩 New message received:", newMessage);
  
      setMessages((prev) => {
        // const msg = normalizeMessage(newMessage);
        if (prev.some((m) => m._id === newMessage._id)) return prev; // Avoid duplicates
        return [...prev, newMessage];
      });
    };
  
    const handleUserTyping = ({ senderId }: { senderId: string }) => {
      if (senderId !== userId) {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
      }
    };
  
    // Remove existing listeners before adding new ones
    socket.off("messagesFetched", handleMessagesFetched);
    socket.off("messageReceived", handleMessageReceived);
    socket.off("userTyping", handleUserTyping);
  
    // Add event listeners
    socket.on("messagesFetched", handleMessagesFetched);
    socket.on("messageReceived", handleMessageReceived);
    socket.on("userTyping", handleUserTyping);
  
    return () => {
      console.log("🚪 Leaving chat room:", chatId);
      socket.emit("leaveChat", chatId);
      socket.off("messagesFetched", handleMessagesFetched);
      socket.off("messageReceived", handleMessageReceived);
      socket.off("userTyping", handleUserTyping);
    };
  }, [chatId]);
  
  const fetchMessages = useCallback(() => {
    if (!hasMore || loading) return;
    setLoading(true);
    socket.emit("fetchMessages", { chatId, page, limit: MESSAGES_PER_PAGE });
    setPage((prev) => prev + 1);
  }, [chatId, hasMore, loading, page]);

  const sendMessage = (message: string) => {
    if (!message.trim()) return;
    const newMessage = normalizeMessage({
      senderId: userId,
      content: message,
    });

    setMessages((prev) => [...prev, newMessage]);
    socket.emit("sendMessage", { chatId, message, senderId: userId });
  };

  const handleTyping = () => {
    socket.emit("typing", { chatId, senderId: userId });
  };

  return { messages, sendMessage, fetchMessages, hasMore, typing, loading, handleTyping };
};

export default useChatSockets;
