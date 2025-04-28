import { useState, useMemo, useEffect } from "react";
import { useAuthStore } from "@/appStore/AuthStore";
import { Moon, Sun, Search, Phone, Video } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { useFetchChats } from "@/hooks/chatHooks/useFetchChats";
import { useChat } from "@/hooks/chatHooks/useChat";
import { useChatHandler } from "@/hooks/chatHooks/useChatHandler";
import ChatList from "../chat/ChatList";
import ChatMessages from "../chat/ChatMessages";
import FriendsListModal from "./FriendsListModal";
import CallUI from "../chat/CallUI";
import { useWebRTC } from "@/hooks/webrtc/useWebRTC";
import { socket } from "@/utils/Socket";

interface User {
  _id: string;
  username: string;
  avatar?: string;
}

const ChatSection = () => {
  const { user } = useAuthStore();
  const userId = user?._id || "";

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video" | null>(null);
  const [inCall, setInCall] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const { chats } = useFetchChats();
  const { selectedChat, setSelectedChat, createChatWithUser } = useChat(userId);
  const { handleUserSelect } = useChatHandler(userId, chats, setSelectedChat, setShowFriendsList, createChatWithUser);

  const [callActive, setCallActive] = useState(false);

  const {
    startCall,
    endCall,
    localStream,
    remoteStream,
    toggleMic,
    toggleVideo,
    isMicOn,
    isVideoOn,
    incomingCall,
    acceptCall,

  } = useWebRTC({
    userId,
    chatId: selectedChat?.users.find((u) => u._id !== userId)?._id,
    onCallEnd: () => {
      setInCall(false);
      setCallType(null);
    },
    onCallStart: () => {
      setInCall(true);
    },
    setCallActive
  });

  const { data: followers } = useQuery({
    queryKey: ["followers", userId],
    queryFn: () => userService.getFollowers(userId),
    enabled: !!userId,
  });

  const { data: following } = useQuery({
    queryKey: ["following", userId],
    queryFn: () => userService.getFollowing(userId),
    enabled: !!userId,
  });

  const allUsers: User[] = useMemo(() => {
    if (!followers && !following) return [];
    const userMap = new Map<string, User>();
    [...(followers || []), ...(following || [])].forEach((user) => {
      userMap.set(user._id, user);
    });
    return Array.from(userMap.values());
  }, [followers, following]);

  const handleStartCall = (type: "voice" | "video") => {
    if (!selectedChat) return;
    setCallType(type);
    setInCall(true);
    startCall(type);
  };

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

  const otherUser =
    selectedChat && !selectedChat.isGroupChat && userId
      ? selectedChat.users.find((u) => u._id !== userId)
      : null;

  const isOtherUserOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  return (
    <div
      className={`flex flex-col h-[740px] w-full max-w-4xl border transition-all ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      {/* Header */}
      <div className="p-2 flex justify-between items-center border-b">
        <div className="mr-2 p-2 flex items-center justify-end">
          <div
            className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-md px-2 cursor-pointer"
            onClick={() => setShowFriendsList(true)}
          >
            <Search className="w-5 h-5 text-gray-500" />
            <p className="ml-1 text-gray-500">Search friends...</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedChat && otherUser && (
            <div className="flex flex-col items-end mr-2">
              <p className="text-sm font-medium">{otherUser.username}</p>
              <p className={`text-xs ${isOtherUserOnline ? "text-green-500" : "text-gray-400"}`}>
                {isOtherUserOnline ? "Active" : "Inactive"}
              </p>
            </div>
          )}

          {selectedChat && (
            <>
              <button
                onClick={() => handleStartCall("voice")}
                className="p-2 rounded-full hover:bg-blue-500 hover:text-white transition"
                title="Start Voice Call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleStartCall("video")}
                className="p-2 rounded-full hover:bg-green-500 hover:text-white transition"
                title="Start Video Call"
              >
                <Video className="w-5 h-5" />
              </button>
            </>
          )}

          <button
            className="p-2 rounded-full"
            onClick={() => {
              setDarkMode((prev) => {
                const newMode = !prev;
                localStorage.setItem("darkMode", newMode.toString());
                return newMode;
              });
            }}
          >
            {darkMode ? <Sun className="text-yellow-400 w-6 h-6" /> : <Moon className="text-gray-600 w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Friends Modal */}
      <FriendsListModal
        isOpen={showFriendsList}
        onClose={() => setShowFriendsList(false)}
        users={allUsers}
        onSelectUser={handleUserSelect}
        darkMode={darkMode}
      />

      {/* Main Content */}
      <div className="flex flex-grow">
        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
        />
        {selectedChat && (
          <div className="flex flex-col flex-grow border-l">
            <ChatMessages chatId={selectedChat._id} darkMode={darkMode} userId={userId} />
          </div>
        )}
      </div>

      {/* Call UI */}
      {inCall && callType && (
     <CallUI

     callType={callType}
     localStream={localStream}
     remoteStream={remoteStream}
     onClose={() => endCall()}
     isMicOn={isMicOn}
     isVideoOn={isVideoOn}
     onToggleMic={toggleMic}
     onToggleVideo={toggleVideo}
     otherUser={otherUser ? { username: otherUser.username, avatar: otherUser.avatar } : undefined}
     callActive = {callActive}
     incomingCall={!!incomingCall}
   />
   
      )}

    
    </div>
  );
};

export default ChatSection;
