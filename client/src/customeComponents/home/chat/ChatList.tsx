import React, { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/appStore/AuthStore";
import { NormalizedChat, normalizeChat } from "@/utils/normalizeChat";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/utils/Socket";
import useMessageStore from "@/appStore/useMessageStore";

interface ChatListProps {
  chats: any[];
  selectedChat: NormalizedChat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<NormalizedChat | null>>;
}

const ChatList: React.FC<ChatListProps> = ({ chats, selectedChat, setSelectedChat }) => {
  const { user } = useAuthStore();
  const userId = user?._id;
  const [loading, setLoading] = useState(true);
  const [normalizedChats, setNormalizedChats] = useState<NormalizedChat[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const {
    setCurrentlyOpenChatId,
    resetUnreadCount,
    unreadCounts
  } = useMessageStore();

  useEffect(() => {
    if (!Array.isArray(chats)) return;
    setNormalizedChats(chats.map(normalizeChat));
    setLoading(false);
  }, [chats]);

  useEffect(() => {
    if (!userId) return;

    const handleMessageReceived = (newMessage: any) => {
      queryClient.invalidateQueries({ queryKey: ["chats", userId] });
      const updatedChats = queryClient.getQueryData<NormalizedChat[]>(["chats", userId]);
      if (Array.isArray(updatedChats)) {
        setNormalizedChats(updatedChats.map(normalizeChat));
      }
    };

    socket.on("chatUpdated", handleMessageReceived);
    return () => {
      socket.off("chatUpdated", handleMessageReceived);
    };
  }, [queryClient, userId]);

  useEffect(() => {
    socket.emit("getOnlineUsers");

    const handleUpdate = (onlineUserIds: string[]) => {
      setOnlineUsers(onlineUserIds);
    };

    socket.on("updateOnlineUsers", handleUpdate);

    return () => {
      socket.off("updateOnlineUsers", handleUpdate);
    };
  }, [selectedChat]);

  if (!user || loading) {
    return <p className="text-gray-400 text-center">Loading chats...</p>;
  }

  return (
    <ScrollArea className="w-1/3 border-r h-[75vh] p-4">
      <h2 className="text-lg font-semibold mb-3">Chats</h2>

      {normalizedChats.length > 0 ? (
        normalizedChats.map((chat) => {
          if (!chat || !Array.isArray(chat.users)) return null;

          const otherUser = !chat.isGroupChat && userId
            ? chat.users.find((u) => u._id !== userId)
            : null;

          const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

          const unreadCount = unreadCounts[chat._id] || 0;

          return (
            <div
              key={chat._id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all relative",
                selectedChat?._id === chat._id
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              onClick={() => {
                setSelectedChat(chat);
                setCurrentlyOpenChatId(chat._id);
                resetUnreadCount(chat._id);
              }}
            >
              {/* Avatar with online dot */}
              <div className="relative">
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
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                )}
              </div>

              {/* Username + last message */}
              <div className="flex-1">
                <p className="font-medium truncate">
                  {chat.isGroupChat ? chat.groupName || "Group Chat" : otherUser?.username || "Unknown"}
                </p>
                <p className="text-sm text-green-500 truncate">
                  {chat.lastMessage?.text || chat.lastMessage?.content || "No messages yet"}
                </p>
              </div>

              {/* Unread Count Badge */}
              {unreadCount > 0 && (
  <div className="bg-green-600 text-white text-[11px] px-2 py-[2px] rounded-full min-w-[20px] text-center shadow-md font-semibold">
    {unreadCount > 99 ? "99+" : unreadCount}
  </div>
)}

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
