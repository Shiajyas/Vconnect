import React, { useEffect, useState } from "react";
import { socket } from "@/utils/Socket";
import { useAuthStore } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query"; // ✅ Correct
import ChatList from "./ChatList";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "video";
  createdAt: string;
}

interface Chat {
  _id: string;
  members: string[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}

const ChatSection = () => {
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // If user is not authenticated, show a message
  if (!user) {
    return (
      <div className="flex h-[800px] items-center justify-center">
        <p className="text-xl">Please log in to access the chat</p>
      </div>
    );
  }

  const { data: chats, isLoading, error } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await fetch("/api/chats");
      if (!res.ok) throw new Error("Failed to fetch chats");
      return res.json();
    },
  });

  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    // Initialize theme from system preference or stored value
    const savedTheme = localStorage.getItem('chat-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    // Save theme preference
    localStorage.setItem('chat-theme', theme);
  }, [theme]);


  useEffect(() => {
    socket.on("receiveMessage", (message: Message) => {
      if (message.chatId === selectedChat?._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on("userTyping", (chatId: string) => {
      if (chatId === selectedChat?._id) setTyping(true);
      setTimeout(() => setTyping(false), 2000);
    });

    socket.on("updateOnlineUsers", (users: string[]) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("updateOnlineUsers");
    };
  }, [selectedChat]);

  const sendMessage = (message: string) => {
    if (!selectedChat?._id || !user._id) return;
    socket.emit("sendMessage", { 
      chatId: selectedChat._id, 
      senderId: user._id, 
      content: message, 
      type: "text" 
    });
  };

  return (
    <div className={`flex h-[800px] shadow-lg rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
      <div className="absolute right-4 top-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full ${
            theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-gray-200'
          }`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
      <ChatList chats={chats} selectedChat={selectedChat} setSelectedChat={setSelectedChat} onlineUsers={onlineUsers} />
      <div className={`w-2/3 flex flex-col ${theme === 'light' ? 'bg-white' : 'bg-gray-800 text-white'}`}>
        <ChatMessages messages={messages} userId={user._id} typing={typing} />
        <ChatInput sendMessage={sendMessage} handleTyping={() => socket.emit("typing", { chatId: selectedChat?._id })} />
      </div>
    </div>
  );
};

export default ChatSection;
