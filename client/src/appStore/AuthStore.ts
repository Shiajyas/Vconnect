import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IUser } from '@/types/userTypes';
import { authService } from '@/services/authService';

interface AuthState {
  user: IUser | null;
  admin: IUser | null;
  isUserAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  setUser: (user: IUser | null) => void;
   updateUserFields: (fields: Partial<IUser>) => void;
  setAdmin: (admin: IUser | null) => void;
  logout: (role?: 'user' | 'admin') => void;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      admin: null,
      isUserAuthenticated: false,
      isAdminAuthenticated: false,

      setUser: (user) => {
        set({ user, isUserAuthenticated: !!user });
      },

      setAdmin: (admin) => {
        set({ admin, isAdminAuthenticated: !!admin });
      },


           updateUserFields: (fields) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...fields } : null,
        }));
      },
      
      logout: async (role) => {
        if (role === 'admin') {
          set({ admin: null, isAdminAuthenticated: false });
        } else {
          set({ user: null, isUserAuthenticated: false });
        }

        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error (background):', error);
        }

        // ✅ Clear persisted storage on logout
        setTimeout(() => {
          useAuthStore.persist.clearStorage();
        }, 0);
      },
    }),
    {
      name: 'auth-storage', // Key name in localStorage
      storage: createJSONStorage(() => localStorage), // Persist to localStorage
    },
  ),
);
