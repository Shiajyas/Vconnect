import { useState, useEffect } from 'react';
import { chatSocket as socket } from '@/utils/chatSocket';
import { NormalizedChat, normalizeChat } from '@/utils/normalizeChat';

interface SharePostOptions {
  senderId: string;
  receiverId: string;
  postContent: string;
}

export const useChat = (userId: string | null) => {
  const [chats, setChats] = useState<NormalizedChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<NormalizedChat | null>(null);

  const createChatWithUser = (selectedUserId: string): Promise<NormalizedChat | null> => {
    return new Promise((resolve) => {
      if (!socket || !userId || !selectedUserId) return resolve(null);

      const timeout = setTimeout(() => {
        console.warn('⏰ Timeout waiting for chatCreated');
        socket.off('chatCreated', handleChatCreated);
        resolve(null);
      }, 5000);

      const handleChatCreated = (data: any) => {
        const normalized = normalizeChat(data.chat);

        const userIds = normalized.users.map((u) => u._id);
        const isCorrectChat = userIds.includes(userId) && userIds.includes(selectedUserId);

        if (!isCorrectChat) return;

        clearTimeout(timeout);
        socket.off('chatCreated', handleChatCreated);
        resolve(normalized);
      };

      socket.on('chatCreated', handleChatCreated);

      socket.emit('createChat', {
        senderId: userId,
        receiverId: selectedUserId,
      });
    });
  };

  const sharePostWithUser = async ({ senderId, receiverId, postContent }: SharePostOptions) => {
    console.log('🔔 sharePostWithUser triggered', { senderId, receiverId, postContent });

    try {
      const chat = await createChatWithUser(receiverId);
      console.log('💬 Chat returned:', chat);

      if (!chat) throw new Error('Failed to get or create chat');

      socket.emit('joinChat', chat._id);
      socket.emit('sendMessage', {
        chatId: chat._id,
        message: postContent,
        senderId,
        type: 'link',
      });

      console.log('✅ Post shared successfully in chat:', chat._id);
    } catch (err) {
      console.error('❌ Error sharing post:', err);
    }
  };

  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewChat = (newChat: any) => {
      const normalizedChat = normalizeChat(newChat.chat);
      console.log('📥 chatCreated event received globally:', normalizedChat);

      setChats((prevChats) => {
        if (prevChats.some((chat) => chat._id === normalizedChat._id)) return prevChats;
        return [normalizedChat, ...prevChats];
      });

      setSelectedChat((prevChat) =>
        prevChat?._id === normalizedChat._id ? prevChat : normalizedChat,
      );
    };

    socket.on('chatCreated', handleNewChat);
    return () => {
      socket.off('chatCreated', handleNewChat);
    };
  }, [userId]);

  return {
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    createChatWithUser,
    sharePostWithUser,
  };
};
