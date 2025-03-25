import React, { useRef, useEffect } from "react";
import { useInfiniteScroll } from "@/customeComponents/common/useInfiniteScroll";
import useChatSockets from "@/hooks/chatHooks/useChatSocket";

interface Message {
  _id: string;
  senderId: string;
  content: string;
  createdAt?: string;
}

interface ChatMessagesProps {
  chatId: string;
  userId: string;
  darkMode: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ chatId, userId, darkMode }) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const { messages, fetchMessages, hasMore, typing, loading } = useChatSockets(chatId, userId);

  console.log("📥 Messages:", messages);

  useInfiniteScroll(chatContainerRef, fetchMessages, hasMore, loading);

  // Scroll to the latest message on new messages
  useEffect(() => {
    if (lastMessageRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={chatContainerRef}
      className={`flex flex-col flex-grow overflow-y-auto overflow-x-hidden p-4 space-y-2 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
      style={{ height: "60vh", scrollbarWidth: "none" }}
    >
      {/* Hide Scrollbar */}
      <style>
        {`
          ::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      {hasMore && !loading && (
        <p className="text-center text-gray-500 text-sm">Loading older messages...</p>
      )}

      {messages.map((msg, index) => {
        const isSelf = msg?.sender?._id?._id === userId ;
        return (
          <div
            key={msg._id}
            ref={index === messages.length - 1 ? lastMessageRef : null}
            className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                isSelf ? "bg-blue-500 text-white self-end" : "bg-gray-200 text-black self-start"
              }`}
            >
              <p>{msg.content}</p>
            </div>
          </div>
        );
      })}

      {typing && <p className="text-sm text-gray-500 self-start">Typing...</p>}
    </div>
  );
};

export default ChatMessages;
