import { useState } from "react";
import { useAuthStore } from "@/context/AuthContext";
import { Moon, Sun, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { useFetchChats } from "@/hooks/chatHooks/useFetchChats";
import { useChat } from "@/hooks/chatHooks/useChat";
import { useChatHandler } from "@/hooks/chatHooks/useChatHandler";
import ChatList from "../chat/ChatList";
import ChatMessages from "../chat/ChatMessages";
import ChatInput from "../chat/ChatInput";
import FriendsListModal from "./FriendsListModal";

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

  const { chats } = useFetchChats();
  const { selectedChat, setSelectedChat, createChatWithUser } = useChat(userId);
  const { handleUserSelect } = useChatHandler(userId, chats, setSelectedChat, setShowFriendsList, createChatWithUser);

  // Fetch Followers & Following
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

  // Merge Follow Lists & Remove Duplicates
  const allUsers: User[] = Array.from(
    new Map(
      [...(followers || []), ...(following || [])].map((user) => [user._id, user])
    ).values()
  );

  return (
    <div className={`flex flex-col h-[650px] w-full max-w-4xl border transition-all ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      {/* Header */}
      <div className="p-2 flex justify-between items-center border-b">
        <div className="mr-2 p-2 flex items-center justify-end">
          <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-md px-2 cursor-pointer" onClick={() => setShowFriendsList(true)}>
            <Search className="w-5 h-5 text-gray-500" />
            <p className="ml-1 text-gray-500">Search friends...</p>
          </div>
        </div>

        <button className="p-2 rounded-full" onClick={() => {
          setDarkMode((prev) => {
            const newMode = !prev;
            localStorage.setItem("darkMode", newMode.toString());
            return newMode;
          });
        }}>
          {darkMode ? <Sun className="text-yellow-400 w-6 h-6" /> : <Moon className="text-gray-600 w-6 h-6" />}
        </button>
      </div>

      <FriendsListModal isOpen={showFriendsList} onClose={() => setShowFriendsList(false)} users={allUsers} onSelectUser={handleUserSelect} darkMode={darkMode} />

      <div className="flex flex-grow">
        <ChatList chats={chats} selectedChat={selectedChat} setSelectedChat={setSelectedChat} />
        {selectedChat && (
          <div className="flex flex-col flex-grow border-l">
            <ChatMessages chatId={selectedChat._id} darkMode={darkMode} userId={userId} />
            <ChatInput userId={userId} chatId={selectedChat._id} darkMode={darkMode} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSection;
