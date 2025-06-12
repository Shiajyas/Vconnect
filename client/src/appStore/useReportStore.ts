// stores/useReportStore.ts
import { create } from "zustand";

interface ReportStore {
  reportCount: number;
  setReportCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  reportCount: 0,
  setReportCount: (count) => set({ reportCount: count }),
  increment: () => set((state) => ({ reportCount: state.reportCount + 1 })),
  decrement: () => set((state) => ({ reportCount: Math.max(0, state.reportCount - 1) })),
}));
