import { create } from 'zustand';

interface LiveStream {
  userId: string;
  username: string;
  avatar?: string;
  streamId: string;
}

type LiveStore = {
  // Self state
  isLive: boolean;
  setIsLive: (live: boolean) => void;

  isActive: boolean;
  setIsActive: (active: boolean) => void;

  liveStreamId: string | null;
  setLiveStreamId: (id: string | null) => void;

  liveUserIds: string[];
  setLiveUserIds: (ids: string[]) => void;
  addViewer: (userId: string) => void;
  removeViewer: (userId: string) => void;

  isHost: boolean;
  setIsHost: (isHost: boolean) => void;

  comments: any[];
  addComment: (comment: any) => void;
  clearComments: () => void;

  // Global live streams
  liveStreams: LiveStream[];
  setLiveStreams: (streams: LiveStream[]) => void;
  addLiveStream: (stream: LiveStream) => void;
  removeLiveStream: (userId: string) => void;
  clearLiveStreams: () => void;
};

export const useLiveStore = create<LiveStore>((set) => ({
  isLive: false,
  setIsLive: (isLive) => set({ isLive }),

  isActive: false,
  setIsActive: (isActive) => set({ isActive }),

  liveStreamId: null,
  setLiveStreamId: (id) => set({ liveStreamId: id }),

  liveUserIds: [],
  setLiveUserIds: (ids) => set({ liveUserIds: ids }),
  addViewer: (userId) =>
    set((state) => ({
      liveUserIds: state.liveUserIds.includes(userId)
        ? state.liveUserIds
        : [...state.liveUserIds, userId],
    })),
  removeViewer: (userId) =>
    set((state) => ({
      liveUserIds: state.liveUserIds.filter((id) => id !== userId),
    })),

  isHost: false,
  setIsHost: (isHost) => set({ isHost }),

  comments: [],
  addComment: (comment) => set((state) => ({ comments: [...state.comments, comment] })),
  clearComments: () => set({ comments: [] }),

  liveStreams: [],
  setLiveStreams: (streams) => set({ liveStreams: streams }),
  addLiveStream: (stream) =>
    set((state) => {
      if (state.liveStreams.find((s) => s.userId === stream.userId)) return state;
      return { liveStreams: [...state.liveStreams, stream] };
    }),
  removeLiveStream: (userId) =>
    set((state) => ({
      liveStreams: state.liveStreams.filter((s) => s.userId !== userId),
    })),
  clearLiveStreams: () => set({ liveStreams: [] }),
}));
