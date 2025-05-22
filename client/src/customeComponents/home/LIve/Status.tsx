import React, { useEffect } from 'react';
import { useLiveStore } from '@/appStore/useLiveStore';
import LiveAvatar from './LiveAvatar';
import { useStartLive } from '@/hooks/live/useStartLive';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/appStore/useUserStore';
import { useAuthStore } from '@/appStore/AuthStore';
import mediaSocket from '@/utils/mediaSocket'; // ✅ Use media socket

const Status = () => {
  const navigate = useNavigate();
  const users = useUserStore((state) => state.users);
  const addUser = useUserStore((state) => state.addUser);
  const { user: currentUser } = useAuthStore();
  const { startLive } = useStartLive(currentUser?._id);

  const liveStreams = useLiveStore((state) => state.liveStreams);
  const addLiveStream = useLiveStore((state) => state.addLiveStream);
  const removeLiveStream = useLiveStore((state) => state.removeLiveStream);

  console.log('Status liveStreams', liveStreams);

  console.log(currentUser, '>>>>>>');

  useEffect(() => {
    const handleJoin = (user: any) => addUser(user);

    const handleLiveStart = (stream: {
      userId: string;
      username: string;
      avatar?: string;
      streamId: string;
    }) => {
      addLiveStream(stream);
    };

    const handleLiveEnd = (data: { userId: string }) => {
      removeLiveStream(data.userId);
    };

    mediaSocket.on('user:joined', handleJoin);
    mediaSocket.on('live:started', handleLiveStart); // ✅ updated event name
    mediaSocket.on('live:ended', handleLiveEnd); // ✅ updated event name

    return () => {
      mediaSocket.off('user:joined', handleJoin);
      mediaSocket.off('live:started', handleLiveStart);
      mediaSocket.off('live:ended', handleLiveEnd);
    };
  }, [addUser, addLiveStream, removeLiveStream]);

  if (!currentUser) return null;

  return (
    <div className="flex space-x-4 overflow-x-auto p-2">
      {/* Start your own live stream */}
      <LiveAvatar
        avatarUrl={currentUser.avatar}
        username={currentUser.username}
        isLive={true}
        onClick={startLive}
        isStartButton
      />

      {/* Join ongoing streams */}
      {liveStreams
        .filter((stream) => stream.userId !== currentUser._id)
        .map((stream) => (
          <LiveAvatar
            key={stream.userId}
            avatarUrl={stream.avatar}
            username={stream.username}
            isLive={true}
            onClick={() => {
              useLiveStore.getState().setIsHost(false);
              navigate(`/home/live/${stream.userId}`);
            }}
          />
        ))}
    </div>
  );
};

export default Status;
