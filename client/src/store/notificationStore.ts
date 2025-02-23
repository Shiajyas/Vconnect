import { create } from "zustand";

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  resetUnreadCount: () => void;
  incrementUnreadCount: () => void;
}

const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  resetUnreadCount: () => set({ unreadCount: 0 }),
  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
}));

export default useNotificationStore;
