import React, { useEffect } from 'react'
import { useLiveStore } from '@/appStore/useLiveStore'
import LiveAvatar from './LiveAvatar'
import { useStartLive } from '@/hooks/live/useStartLive'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/appStore/useUserStore'
import { socket } from '@/utils/Socket'
import { useAuthStore } from '@/appStore/AuthStore'

const Status = () => {
  const liveUserIds = useLiveStore((state) => state.liveUserIds)
  const navigate = useNavigate()
  const users = useUserStore((state) => state.users)
  const addUser = useUserStore((state) => state.addUser)
  const { user: currentUser } = useAuthStore()
  // console.log('currentUser', currentUser?._id)
  const { startLive } = useStartLive(currentUser?._id)  // ✅ fixed

  useEffect(() => {
    const handleJoin = (user: any) => addUser(user)
    socket.on('user:joined', handleJoin)
    return () => {
      socket.off('user:joined', handleJoin)
    }
  }, [addUser])

  if (!currentUser) return null

  return (
    <div className="flex space-x-4 overflow-x-auto p-2">
      <LiveAvatar
        avatarUrl={currentUser.avatar}
        username={currentUser.username}
        isLive={true}
        onClick={startLive}
        isStartButton
      />
      {users.map((user) => (
        <LiveAvatar
          key={user._id}
          avatarUrl={user.avatar}
          username={user.username}
          isLive={liveUserIds.includes(user._id)}
          onClick={() => {
            if (liveUserIds.includes(user._id)) {
              useLiveStore.getState().setIsHost(false) 
              navigate(`/home/live/${user._id}`)
            }
          }}
        />
      ))}
    </div>
  )
}

export default Status
