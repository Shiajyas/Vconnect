import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SubscriptionState {
  isAuthenticated: boolean;
  isSubscribed: boolean;
  startDate: string | null;
  endDate: string | null;
  setSubscription: (status: boolean, start: string | null, end: string | null) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isSubscribed: false,
      startDate: null,
      endDate: null,
      setSubscription: (status, start, end) => set({ isSubscribed: status, startDate: start, endDate: end }),
    }),
    { name: "subscription-storage" } // Stored in localStorage
  )
);


