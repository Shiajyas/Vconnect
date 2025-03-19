import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Chat {
  _id: string;
  members: string[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat) => void;
  onlineUsers: string[];
}

const ChatList: React.FC<ChatListProps> = ({ chats, selectedChat, setSelectedChat, onlineUsers }) => {
  return (
    <ScrollArea className="w-1/3 border-r p-4">
      <h2 className="text-lg font-semibold mb-3">Chats</h2>
      {chats?.map((chat) => (
        <div
          key={chat._id}
          className={cn(
            "p-3 flex items-center gap-3 rounded-lg cursor-pointer hover:bg-gray-100 transition",
            selectedChat?._id === chat._id && "bg-gray-200"
          )}
          onClick={() => setSelectedChat(chat)}
        >
          <Avatar>
            <AvatarImage src={chat.isGroup ? chat.groupAvatar || "/group.png" : "/user.png"} />
            <AvatarFallback>{chat.isGroup ? "G" : "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <p className="text-sm font-medium">{chat.isGroup ? chat.groupName : "Private Chat"}</p>
          </div>
          {onlineUsers.includes(chat._id) && <span className="w-3 h-3 bg-green-500 rounded-full"></span>}
        </div>
      ))}
    </ScrollArea>
  );
};

export default ChatList;
