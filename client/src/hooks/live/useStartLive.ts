import useLiveStream from './useLiveStream'
import { useNavigate } from 'react-router-dom'
import { useLiveStore } from '@/appStore/useLiveStore'
import { useState } from 'react'

export const useStartLive = (streamId: string) => {
  
  const isActive = useLiveStore((s) => s.isActive)
  const setIsActive = useLiveStore((s) => s.setIsActive)
  const navigate = useNavigate()
  const setIsHost = useLiveStore((s) => s.setIsHost)

  const live = useLiveStream(true, streamId, isActive)

  const startLive = () => {
    setIsHost(true) // ✅ mark as host before navigating
    setIsActive(true)
    navigate(`/home/live/${streamId}`)
  }

  return {
    ...live,
    startLive,
  }
}





