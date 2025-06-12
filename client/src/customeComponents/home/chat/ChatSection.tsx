import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/appStore/AuthStore';
import { Moon, Sun, Search, Phone, Video, ArrowLeft, History } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { useFetchChats } from '@/hooks/chatHooks/useFetchChats';
import { useChat } from '@/hooks/chatHooks/useChat';
import { useChatHandler } from '@/hooks/chatHooks/useChatHandler';
import ChatList from '../chat/ChatList';
import ChatMessages from '../chat/ChatMessages';
import FriendsListModal from './FriendsListModal';
import CallUI from '../chat/CallUI';
import { useWebRTC } from '@/hooks/webrtc/useWebRTC';
import { chatSocket as socket } from '@/utils/chatSocket';
import { CallHistoryList } from './CallHistoryList';

import { useIncomingCallStore } from '@/appStore/useIncomingCallStore';

interface User {
  _id: string;
  username: string;
  avatar?: string;
}

const ChatSection = () => {
  const { user } = useAuthStore();
  const userId = user?._id || '';

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [inCall, setInCall] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [showCallHistory, setShowCallHistory] = useState(false);

  const { chats } = useFetchChats();
  const { selectedChat, setSelectedChat, createChatWithUser } = useChat(userId);
  const { handleUserSelect } = useChatHandler(
    userId,
    chats,
    setSelectedChat,
    setShowFriendsList,
    createChatWithUser,
  );

  const {
    // incomingCall,
    activeCall,
  } = useIncomingCallStore();

  const [callActive, setCallActive] = useState(!!activeCall);

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
    isRemoteMicOn,
    isRemoteVideoOn,
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
    setCallActive,
    callType: callType || 'voice',
    activeChatId: selectedChat?._id,
  });

  const { data: followers } = useQuery({
    queryKey: ['followers', userId],
    queryFn: () => userService.getFollowers(userId),
    enabled: !!userId,
  });

  const { data: following } = useQuery({
    queryKey: ['following', userId],
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

  const handleStartCall = (type: 'voice' | 'video') => {
    if (!selectedChat) return;
    setCallType(type);
    setInCall(true);
    startCall(type);
  };

  useEffect(() => {
    socket.emit('getOnlineUsers');

    const handleUpdate = (onlineUserIds: string[]) => {
      setOnlineUsers(onlineUserIds);
    };

    socket.on('updateOnlineUsers', handleUpdate);

    return () => {
      socket.off('updateOnlineUsers', handleUpdate);
    };
  }, [selectedChat]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // When a chat is selected in mobile view, show the messages
  useEffect(() => {
    if (selectedChat && isMobileView) {
      setShowChatList(false);
    }
  }, [selectedChat, isMobileView]);

  const otherUser =
    selectedChat && !selectedChat.isGroupChat && userId
      ? selectedChat.users.find((u) => u._id !== userId)
      : null;

  const isOtherUserOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  const handleBackToList = () => {
    setShowChatList(true);
  };

  return (
    <div
      className={`flex flex-col h-full w-full max-w-4xl border transition-all ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'
      }`}
    >
      {/* Header */}
      <div className="p-2 flex justify-between items-center border-b">
        {isMobileView && selectedChat && !showChatList && (
          <button onClick={handleBackToList} className="mr-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="mr-2 p-2 flex items-center justify-end flex-grow">
          <div
            className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-md px-2 cursor-pointer w-full max-w-xs"
            onClick={() => setShowFriendsList(true)}
          >
            <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <p className="ml-1 text-gray-500 truncate">Search friends...</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedChat && otherUser && (!isMobileView || !showChatList) && (
            <div className="hidden sm:flex flex-col items-end mr-2">
              <p className="text-sm font-medium">{otherUser.username}</p>
              <p className={`text-xs ${isOtherUserOnline ? 'text-green-500' : 'text-gray-400'}`}>
                {isOtherUserOnline ? 'Active' : 'Inactive'}
              </p>
            </div>
          )}

          {selectedChat && (!isMobileView || !showChatList) && (
            <>
              <button
                onClick={() => handleStartCall('voice')}
                className="p-2 rounded-full hover:bg-blue-500 hover:text-white transition"
                title="Start Voice Call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleStartCall('video')}
                className="p-2 rounded-full hover:bg-green-500 hover:text-white transition"
                title="Start Video Call"
              >
                <Video className="w-5 h-5" />
              </button>

              {/* Call History Button */}
            </>
          )}

          {/* <button
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
          </button> */}

          <button
            onClick={() => {
              setShowCallHistory(true);
              console.log('Call history button clicked');
            }}
            className="p-2 rounded-full hover:bg-gray-300 hover:text-gray-700 transition"
            title="Call History"
          >
            <History className="text-gray-800 w-5 h-5" />
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
      <div className="flex flex-grow overflow-hidden">
        {/* ChatList - hidden on mobile when a chat is selected */}
        {(showChatList || !isMobileView) && (
          <div
            className={`${
              isMobileView ? 'w-full' : 'w-[300px] md:w-[350px] lg:w-[280px] xl:w-[250px]'
            } flex-none overflow-y-hidden`}
          >
            <ChatList
              chats={chats}
              selectedChat={selectedChat}
              setSelectedChat={(chat) => {
                setSelectedChat(chat);
                if (isMobileView) {
                  setShowChatList(false);
                }
              }}
            />
          </div>
        )}

        {/* ChatMessages - full width on mobile when a chat is selected */}
        {selectedChat && (!showChatList || !isMobileView) && (
          <div className="flex-grow border-l overflow-y-auto w-full">
            {isMobileView && !showChatList && (
              <div className="p-2 border-b flex items-center">
                <div className="flex items-center">
                  {otherUser?.avatar ? (
                    <img
                      src={otherUser.avatar}
                      alt={otherUser.username}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                      {otherUser?.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{otherUser?.username}</p>
                    <p
                      className={`text-xs ${
                        isOtherUserOnline ? 'text-green-500' : 'text-gray-400'
                      }`}
                    >
                      {isOtherUserOnline ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
          otherUser={
            otherUser ? { username: otherUser.username, avatar: otherUser.avatar } : undefined
          }
          callActive={callActive}
          incomingCall={!!incomingCall}
          isRemoteMicOn={isRemoteMicOn}
          isRemoteVideoOn={isRemoteVideoOn}
        />
      )}

      {showCallHistory && (
        <CallHistoryList
          isOpen={showCallHistory}
          onClose={() => setShowCallHistory(false)}
          chatId={selectedChat?._id}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default ChatSection;
