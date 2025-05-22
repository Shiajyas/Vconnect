import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { NormalizedChat } from '@/utils/normalizeChat';
import { normalizeChat } from '@/utils/normalizeChat';

export const useChatHandler = (
  userId: string,
  chats: NormalizedChat[],
  setSelectedChat: (chat: NormalizedChat) => void,
  setShowFriendsList: (show: boolean) => void,
  createChatWithUser: (friendId: string) => Promise<NormalizedChat | null>,
) => {
  const queryClient = useQueryClient();

  const handleUserSelect = useCallback(
    async (friendId: string) => {
      if (!userId || !friendId) return;

      setShowFriendsList(false);

      const existingChat = chats.find(
        (chat) => !chat.isGroupChat && chat.users.some((user) => user._id === friendId),
      );

      if (existingChat) {
        // console.log("✅ Found existing chat:", existingChat);
        setSelectedChat(existingChat);

        // ✅ Update the query cache instead of using setChats
        queryClient.setQueryData(['chats', userId], (prevChats: NormalizedChat[] = []) => [
          existingChat,
          ...prevChats.filter((chat) => chat._id !== existingChat._id),
        ]);
        return;
      }

      // console.log("🚀 Creating new chat with:", friendId);
      const newChat = await createChatWithUser(friendId);

      if (!newChat) {
        console.error('❌ Chat creation failed!');
        return;
      }

      // console.log("📥 New chat created:", newChat);

      // ✅ Update the query cache with the new chat
      queryClient.setQueryData(['chats', userId], (prevChats: NormalizedChat[] = []) => [
        newChat,
        ...prevChats.filter((chat) => chat._id !== newChat._id),
      ]);

      setTimeout(() => {
        setSelectedChat(newChat);
      }, 0);
    },
    [userId, chats, setSelectedChat, createChatWithUser, queryClient],
  );

  return { handleUserSelect };
};
