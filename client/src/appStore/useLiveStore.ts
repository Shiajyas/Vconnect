
import { create } from 'zustand'

type LiveStore = {
  isLive: boolean
  setLive: (live: boolean) => void
  isActive: boolean,
  setIsActive: (active: boolean) => void,
  liveStreamId: string | null
  setLiveStreamId: (id: string | null) => void
  liveUserIds: string[]
  setLiveUserIds: (ids: string[]) => void
  
  isHost: boolean
  setIsHost: (isHost: boolean) => void
}

export const useLiveStore = create<LiveStore>((set) => ({
  isLive: false,
  setLive: (isLive) => set({ isLive }),
  isActive: false,
  setIsActive: (isActive) => set({ isActive }),
  liveStreamId: null,
  setLiveStreamId: (id) => set({ liveStreamId: id }),
  liveUserIds: [],
  setLiveUserIds: (ids) => set({ liveUserIds: ids }),
  isHost: false,
  setIsHost: (isHost) => set({ isHost }),
}))
