import { useState, useEffect } from "react";
import { useAuthStore } from "@/context/AuthContext";
import ChatList from "../chat/ChatList";
import ChatMessages from "../chat/ChatMessages";
import ChatInput from "../chat/ChatInput";
import { useChatSocket } from "@/hooks/useChatSocket";
import { Moon, Sun, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { useChat } from "@/hooks/useChat";

interface User {
  _id: string;
  name: string;
  fullname: string;
  avatar?: string;
}

const ChatSection = () => {
  const { user } = useAuthStore();
  const userId = user?._id || null;
  const [searchTerm, setSearchTerm] = useState("");
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem("darkMode") === "true");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const { chats, selectedChat, setSelectedChat, createChatWithUser } = useChat(userId);

  // **Fetch Followers & Following**
  const { data: followers } = useQuery({
    queryKey: ["followers", userId],
    queryFn: () => userService.getFollowers(userId as string),
    enabled: !!userId,
  });

  const { data: following } = useQuery({
    queryKey: ["following", userId],
    queryFn: () => userService.getFollowing(userId as string),
    enabled: !!userId,
  });

  // **Merge Followers & Following (Remove Duplicates)**
  const allUsers: User[] = [
    ...new Map(
      [...(followers || []), ...(following || [])].map((user) => [
        user._id, 
        { ...user, name: user.name || user.fullname, fullname: user.fullname || user.name }
      ])
    ).values(),
  ];

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // **Filter Users Based on Search Input**
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers([]);
    } else {
      setFilteredUsers(
        allUsers.filter((u) =>
          u.fullname.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, allUsers]);

  if (!user) {
    return <div className="p-4">Please log in to access the chat</div>;
  }

  const chatId = selectedChat?._id || null;
  const { messages, typing, sendMessage, fetchNextPage, hasNextPage, isFetchingNextPage, handleTyping } =
    useChatSocket(chatId);

  return (
    <div className={`flex flex-col h-[750px] w-full max-w-4xl border transition-all ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      {/* Header Section */}
      <div className="p-2 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">Chat</h2>
        <button className="p-2 rounded-full" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <Sun className="text-yellow-400 w-6 h-6" /> : <Moon className="text-gray-600 w-6 h-6" />}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative p-2">
        <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-md px-2">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search friends..."
            className="flex-1 p-2 bg-transparent focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      {searchTerm && (
  <div
    className={`absolute top-16 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md shadow-lg rounded-lg p-3 border 
      ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
  >
    {/* Close Button */}
    <button
      className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
        darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-black"
      }`}
      onClick={() => setSearchTerm("")} 
    >
      ✕
    </button>

    {/* Search Results Content */}
    <div className="py-2 space-y-2">
      {allUsers.length > 0 ? (
        allUsers
          .filter((u) => u?.fullname.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, 5) // Show only the top 5 results
          .map((user) => (
            <div
              key={user?._id}
              className={`p-3 flex items-center gap-3 rounded-lg cursor-pointer transition-all 
                ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              onClick={() => {
                createChatWithUser(userId,user?._id);
                setSearchTerm(""); // Close modal after selecting a user
              }}
            >
              <img src={user?.avatar || "/user.png"} className="w-10 h-10 rounded-full" />
              <p className="font-medium">{user?.fullname}</p>
            </div>
          ))
      ) : (
        <div className="text-center text-gray-400 py-4">
          No users found
        </div>
      )}
    </div>
  </div>
)}

      </div>

      {/* Chat List & Messages */}
      <div className="flex flex-grow">
        <ChatList chats={chats} selectedChat={selectedChat} setSelectedChat={setSelectedChat} users={allUsers} />
        <div className="flex flex-col flex-grow">
          {selectedChat ? (
            <>
              <ChatMessages messages={messages} userId={user._id} typing={typing} fetchNextPage={fetchNextPage} hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} />
              <ChatInput sendMessage={(msg) => sendMessage(msg, chatId || "", user._id, selectedChat.members.find(id => id !== user._id) || "")} handleTyping={() => handleTyping(chatId || "")} darkMode={darkMode} />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">Select a chat to start messaging</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSection;
