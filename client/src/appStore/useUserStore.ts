// appStore/useUserStore.ts
import { create } from 'zustand';

type User = {
  _id: string;
  username: string;
  avatar: string;
};

type UserStore = {
  users: User[];
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  setUsers: (users) => set({ users }),
  addUser: (user) =>
    set((state) => ({
      users: [...state.users.filter((u) => u._id !== user._id), user],
    })),
}));
