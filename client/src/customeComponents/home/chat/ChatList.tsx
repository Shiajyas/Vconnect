import React, { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/context/AuthContext";
import { NormalizedChat, normalizeChat } from "@/utils/normalizeChat";

interface ChatListProps {
  chats: any[]; // Accepting any type since we normalize the data
  selectedChat: NormalizedChat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<NormalizedChat | null>>;
}

const ChatList: React.FC<ChatListProps> = ({ chats, selectedChat, setSelectedChat }) => {
  const { user } = useAuthStore();
  const userId = user?._id;
  const [loading, setLoading] = useState(true);
  const [normalizedChats, setNormalizedChats] = useState<NormalizedChat[]>([]);

  // console.log(chats,"chats from chatlist component"); ;

  useEffect(() => {
    if (!Array.isArray(chats)) return;

    const normalized = chats.map(normalizeChat);
    setNormalizedChats(normalized);
    setLoading(false);
  }, [chats]);

  // console.log( normalizedChats," normalized chats from chatlist component"); ;


  if (!user || loading) return <p className="text-gray-400 text-center">Loading chats...</p>;

  return (
    <ScrollArea className="w-1/3 border-r p-4">
      <h2 className="text-lg font-semibold mb-3">Chats</h2>

      {normalizedChats.length > 0 ? (
        normalizedChats.map((chat) => {
          if (!chat || !Array.isArray(chat.users)) {
            console.warn("⚠️ Skipping invalid chat object:", chat);
            return null;
          }

          const otherUser = !chat.isGroupChat && userId
            ? chat.users.find((u) => u._id !== userId)
            : null;

          return (
            <div
              key={chat._id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                selectedChat?._id === chat._id
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              onClick={() => setSelectedChat(chat)}
            >
              <Avatar>
                <AvatarImage
                  src={chat.isGroupChat ? chat.groupAvatar || "/group.png" : otherUser?.avatar || "/user.png"}
                />
                <AvatarFallback>
                  {chat.isGroupChat
                    ? chat.groupName?.charAt(0) || "G"
                    : otherUser?.username?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="font-medium">
                  {chat.isGroupChat ? chat.groupName || "Group Chat" : otherUser?.username || "Unknown"}
                </p>
                <p className="text-sm text-green-500">
                  {/* {chat.lastMessage?.text || chat.lastMessage?.content || "No messages yet"} */}
                </p>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-gray-400 text-center">No active chats</p>
      )}
    </ScrollArea>
  );
};

export default ChatList;
