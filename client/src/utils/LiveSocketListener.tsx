import { useEffect } from 'react';
import mediaSocket from '@/utils/mediaSocket';
import { useLiveStore } from '@/appStore/useLiveStore';

const LiveSocketListener = () => {
  useEffect(() => {
    const {
      addViewer,
      setIsActive,
      setIsLive,
      setLiveStreamId,
      setLiveUserIds,
      clearComments,
      addLiveStream,
      removeLiveStream,
    } = useLiveStore.getState();

    // Viewer joins a stream you're in
    const handleViewerJoined = (data: { streamId: string; userId: string }) => {
      console.log('👤 Viewer joined:', data);
      addViewer(data.userId);
    };

    // The stream you're in ends
    const handleStreamEnded = (data: { streamId: string }) => {
      console.log('🛑 Your stream ended:', data);
      setIsActive(false);
      setIsLive(false);
      setLiveStreamId(null);
      setLiveUserIds([]);
      clearComments();
    };

    // New comment arrives
    const handleNewComment = (comment: any) => {
      console.log('💬 New live comment:', comment);
      useLiveStore.getState().addComment(comment);
    };

    // 🔥 A user starts a new stream
    const handleLiveStarted = (data: {
      userId: string;
      username: string;
      avatar?: string;
      streamId: string;
    }) => {
      console.log('📡 New live started:', data);
      addLiveStream(data);
    };

    // 🔥 A user ends their stream globally
    const handleLiveEnded = (data: { userId: string }) => {
      console.log('📴 Live ended by user:', data.userId);
      removeLiveStream(data.userId);
    };

    mediaSocket.on('viewer:joined', handleViewerJoined);
    mediaSocket.on('stream:ended', handleStreamEnded);
    mediaSocket.on('stream:comment', handleNewComment);

    // 👇 New global live event listeners
    mediaSocket.on('live:started', handleLiveStarted);
    mediaSocket.on('live:ended', handleLiveEnded);

    return () => {
      mediaSocket.off('viewer:joined', handleViewerJoined);
      mediaSocket.off('stream:ended', handleStreamEnded);
      mediaSocket.off('stream:comment', handleNewComment);
      mediaSocket.off('live:started', handleLiveStarted);
      mediaSocket.off('live:ended', handleLiveEnded);
    };
  }, []);

  return null;
};

export default LiveSocketListener;
