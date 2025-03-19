import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "video";
  createdAt: string;
}

interface ChatMessagesProps {
  messages: Message[];
  userId: string;
  typing: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, userId, typing }) => {
  return (
    <ScrollArea className="flex-grow p-3 space-y-3">
      {messages.map((msg) => (
        <div key={msg._id} className={cn("flex", msg.senderId === userId ? "justify-end" : "justify-start")}>
          <div className="p-2 rounded-lg shadow-md max-w-[70%] text-sm bg-gray-100">{msg.content}</div>
        </div>
      ))}
      {typing && <p className="text-gray-500 text-sm">Typing...</p>}
    </ScrollArea>
  );
};

export default ChatMessages;
