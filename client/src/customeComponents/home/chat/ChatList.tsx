import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/context/AuthContext";

interface Chat {
  _id: string;
  members: string[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}

interface User {
  _id: string;
  fullname: string;
  avatar?: string;
}

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat) => void;
  onlineUsers: string[];
  users: User[]; // List of all users to find names
}

const ChatList: React.FC<ChatListProps> = ({ chats, selectedChat, setSelectedChat, onlineUsers, users }) => {
  const { user } = useAuthStore(); // Get current user

  console.log(users,">>>>>>>>>>>>>>>11")
  console.log(chats,">>>>>>>>>>>>>>>22")
  console.log(selectedChat,">>>>>>>>>>>>>>>11")

  return (
    <ScrollArea className="w-1/3 border-r p-4">
      <h2 className="text-lg font-semibold mb-3">Chats</h2>

      {chats?.map((chat) => {
  if (!chat) return null; // ✅ Ensure chat is not null

  const otherUser = !chat.isGroup && Array.isArray(users)
    ? users.find((u) => chat.members?.includes(u?._id) && u?._id !== user?._id)
    : null;

  return (
    <div
      key={chat._id}
      className={cn(
        "p-3 flex items-center gap-3 rounded-lg cursor-pointer hover:bg-gray-100 transition",
        selectedChat?._id === chat._id && "bg-gray-200"
      )}
      onClick={() => setSelectedChat(chat)}
    >
      <Avatar>
        <AvatarImage
          src={chat.isGroup ? chat.groupAvatar || "/group.png" : otherUser?.avatar || "/user.png"}
        />
        <AvatarFallback>{chat.isGroup ? "G" : otherUser?.fullname?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>
      <p className="text-sm font-medium">
        {chat.isGroup ? chat.groupName : otherUser?.fullname || "Unknown User"}
      </p>
      {onlineUsers.includes(chat._id) && <span className="w-3 h-3 bg-green-500 rounded-full"></span>}
    </div>
  );
})}

    </ScrollArea>
  );
};

export default ChatList;
