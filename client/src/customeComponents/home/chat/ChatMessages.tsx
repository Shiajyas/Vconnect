import React, { useRef, useEffect } from "react";
import { useInfiniteScroll } from "@/customeComponents/common/useInfiniteScroll";

interface Message {
  _id: string;
  senderId: string;
  content: string;
  replyTo?: {
    content: string;
  };
}

interface ChatMessagesProps {
  messages: Message[];
  userId: string;
  typing: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, userId, typing, fetchNextPage, hasNextPage, isFetchingNextPage }) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useInfiniteScroll(chatContainerRef, fetchNextPage, hasNextPage, isFetchingNextPage);

  // Scroll to the latest message when a new message arrives
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  return (
    <div ref={chatContainerRef} className="flex flex-col flex-grow overflow-y-auto p-4 space-y-2">
      {hasNextPage && !isFetchingNextPage && <p className="text-center text-gray-500 text-sm">Loading older messages...</p>}

      {messages.map((msg, index) => {
        const isSelf = msg.senderId === userId;
        return (
          <div
            key={msg._id}
            ref={index === messages.length - 1 ? lastMessageRef : null} // Track last message
            className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                isSelf ? "bg-blue-500 text-white self-end" : "bg-gray-200 text-black self-start"
              }`}
            >
              {msg.replyTo && (
                <div className="text-xs text-gray-600 border-l-2 pl-2 mb-1">
                  Replying to: {msg.replyTo.content}
                </div>
              )}
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
