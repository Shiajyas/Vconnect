import { create } from 'zustand';

interface IncomingCallData {
  caller: {
    _id: string;
    username: string;
    avatar?: string;
  };
  chatId: string;
  callType: 'voice' | 'video';
}

interface IncomingCallStore {
  incomingCall: IncomingCallData | null;
  activeCall: IncomingCallData | null;
  setIncomingCall: (data: IncomingCallData) => void;
  clearIncomingCall: () => void;
  setActiveCall: (data: IncomingCallData) => void;
  clearActiveCall: () => void;
}

export const useIncomingCallStore = create<IncomingCallStore>((set) => ({
  incomingCall: null,
  activeCall: null,
  setIncomingCall: (callData) => set({ incomingCall: callData }),
  clearIncomingCall: () => set({ incomingCall: null }),
  setActiveCall: (callData) => set({ activeCall: callData }),
  clearActiveCall: () => set({ activeCall: null }),
}));

export type { IncomingCallData };

export type { IncomingCallStore };
