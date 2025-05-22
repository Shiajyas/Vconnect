import { create } from 'zustand';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001';

interface MessageStore {
  unreadCounts: Record<string, number>;
  setUnreadCount: (chatId: string, count: number) => void;
  resetUnreadCount: (chatId: string) => void;
  incrementUnreadCount: (chatId: string) => void;
  currentlyOpenChatId: string | null;
  setCurrentlyOpenChatId: (chatId: string | null) => void;
}

const useMessageStore = create<MessageStore>((set) => ({
  unreadCounts: {},
  setUnreadCount: (chatId, count) => {
    console.log('setUnreadCount called with:', chatId, count);
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: count,
      },
    }));
  },
  resetUnreadCount: (chatId) => {
    console.log('resetUnreadCount called with:', chatId);
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: 0,
      },
    }));
  },
  incrementUnreadCount: (chatId) =>
    set((state) => {
      const currentCount = state.unreadCounts[chatId] || 0;
      const newCount = currentCount + 1;
      console.log('incrementUnreadCount called for chatId:', chatId, 'new count:', newCount);
      return {
        unreadCounts: {
          ...state.unreadCounts,
          [chatId]: newCount,
        },
      };
    }),
  currentlyOpenChatId: null,
  setCurrentlyOpenChatId: (chatId) => {
    if (typeof window !== 'undefined' && window.location.href === `${BASE_URL}/home/messages`) {
      console.log('setCurrentlyOpenChatId called with:', chatId);
      set({ currentlyOpenChatId: chatId });
    } else {
      set({ currentlyOpenChatId: null });
      console.log('Skipping setCurrentlyOpenChatId due to different URL:', window.location.href);
    }
  },
}));

export default useMessageStore;
