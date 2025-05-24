import React, { useEffect, useState } from 'react';
import { useLiveStore } from '@/appStore/useLiveStore';
import LiveAvatar from './LiveAvatar';
import { useStartLive } from '@/hooks/live/useStartLive';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/appStore/useUserStore';
import { useAuthStore } from '@/appStore/AuthStore';
import mediaSocket from '@/utils/mediaSocket';

const Status = () => {
  const navigate = useNavigate();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  // const [isAuthenticated, setIsAuthenticated] = useState(false);

  const {isUserAuthenticated: isAuthenticated} = useAuthStore();
  
  const users = useUserStore((state) => state.users);
  const addUser = useUserStore((state) => state.addUser);
  const { user: currentUser } = useAuthStore();
  const { startLive } = useStartLive(currentUser?._id);
  
  const liveStreams = useLiveStore((state) => state.liveStreams);
  const addLiveStream = useLiveStore((state) => state.addLiveStream);
  const removeLiveStream = useLiveStore((state) => state.removeLiveStream);
  const setIsHost = useLiveStore((state) => state.setIsHost);

  // Socket connection and authentication
  useEffect(() => {
    if (!currentUser) return;

    const handleConnect = () => {
      console.log('[Socket] Connected to media server');
      setIsSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('[Socket] Disconnected from media server');
      setIsSocketConnected(false);
      // setIsAuthenticated(false);
    };

    const handleConnectError = (error: any) => {
      console.error('[Socket] Connection error:', error);
      setIsSocketConnected(false);
      // setIsAuthenticated(false);
    };

    // Socket connection events
    mediaSocket.on('connect', handleConnect);
    mediaSocket.on('disconnect', handleDisconnect);
    mediaSocket.on('connect_error', handleConnectError);

    // If already connected, authenticate immediately
    if (mediaSocket.connected) {
      handleConnect();
    }

    return () => {
      mediaSocket.off('connect', handleConnect);
      mediaSocket.off('disconnect', handleDisconnect);
      mediaSocket.off('connect_error', handleConnectError);
    };
  }, [currentUser]);
  // Socket event handlers for live streaming
  useEffect(() => {
    if (!currentUser || !isAuthenticated) return;

    const handleUserJoined = (user: {
      userId: string;
      username: string;
      avatar?: string;
      socketId: string;
    }) => {
      console.log('[Socket] User joined:', user);
      // Only add if it's not the current user
      if (user.userId !== currentUser._id) {
        addUser({
          _id: user.userId,
          username: user.username,
          avatar: user?.avatar || '',
          socketId: user?.socketId || '',
        });
      }
    };

    const handleLiveStarted = (stream: {
      userId: string;
      username: string;
      avatar?: string;
      streamId: string;
    }) => {
      console.log('[Socket] Live stream started:', stream);
      // Only add if it's not the current user's stream
      if (stream.userId !== currentUser._id) {
        addLiveStream(stream);
      }
    };

    const handleLiveEnded = (data: { streamId: string }) => {
      console.log('[Socket] Live stream ended:', data);
      removeLiveStream(data.streamId);
    };

    const handleLiveNotify = (data: { hostId: string; streamId: string }) => {
      console.log('[Socket] Live notification:', data);
      // You can show a notification here if needed
    };

    // Register event listeners
    mediaSocket.on('user:joined', handleUserJoined);
    mediaSocket.on('live:started', handleLiveStarted);
    mediaSocket.on('live:ended', handleLiveEnded);
    mediaSocket.on('live:notify', handleLiveNotify);

    return () => {
      mediaSocket.off('user:joined', handleUserJoined);
      mediaSocket.off('live:started', handleLiveStarted);
      mediaSocket.off('live:ended', handleLiveEnded);
      mediaSocket.off('live:notify', handleLiveNotify);
    };
  }, [addUser, addLiveStream, removeLiveStream, currentUser, isAuthenticated]);

  const handleStartLive = async () => {
    if (!isAuthenticated) {
      console.error('Cannot start live stream: not authenticated');
      return;
    }

    try {
      setIsHost(true);
      await startLive();
    } catch (error) {
      console.error('Failed to start live stream:', error);
      setIsHost(false);
    }
  };

  const handleJoinStream = (stream: {
    userId: string;
    username: string;
    avatar?: string;
    streamId: string;
  }) => {
    if (!isAuthenticated) {
      console.error('Cannot join stream: not authenticated');
      return;
    }

    console.log('Joining stream:', stream);
    setIsHost(false);
    navigate(`/home/live/${stream.streamId}`);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-gray-500">Please log in to see live streams</p>
      </div>
    );
  }

  if (!isSocketConnected) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <p className="text-gray-500">Connecting to live server...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-red-500">Authentication failed. Please try refreshing the page.</p>
      </div>
    );
  }

  const availableStreams = liveStreams.filter(
    (stream) => stream.userId !== currentUser._id
  );

  return (
    <div className="flex space-x-4 overflow-x-auto p-2">
      {/* Start your own live stream */}
      <LiveAvatar
        avatarUrl={currentUser.avatar}
        username={currentUser.username}
        isLive={true}
        onClick={handleStartLive}
        isStartButton
      />

      {/* Join ongoing streams */}
      {availableStreams.map((stream) => (
        <LiveAvatar
          key={stream.streamId}
          avatarUrl={stream.avatar}
          username={stream.username}
          isLive={true}
          onClick={() => handleJoinStream(stream)}
        />
      ))}

      {/* Show message when no streams are available */}
      {availableStreams.length === 0 && (
        <div className="flex items-center justify-center p-4 text-gray-500">
          <p>No live streams available. Start one to get the party started! 🎉</p>
        </div>
      )}
    </div>
  );
};

export default Status;
