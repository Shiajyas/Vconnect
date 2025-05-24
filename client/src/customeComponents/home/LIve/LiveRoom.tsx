import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useLiveStream from '@/hooks/live/useLiveStream';
import LiveVideoPlayer from './LiveVideoPlayer';
import LiveComments from './LiveComments';
import { useLiveStore } from '@/appStore/useLiveStore';
import { useAuthStore } from '@/appStore/AuthStore';

const LiveRoom = () => {
  const { id: streamId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { user: currentUser } = useAuthStore();
  const isHost = useLiveStore((s) => s.isHost);
  const isActive = useLiveStore((s) => s.isActive);
  const setIsActive = useLiveStore((s) => s.setIsActive);
  const setLiveStreamId = useLiveStore((s) => s.setLiveStreamId);

  // Validate required data
  useEffect(() => {
    if (!streamId) {
      console.error('No stream ID provided');
      navigate('/home');
      return;
    }

    if (!currentUser) {
      console.error('User not authenticated');
      navigate('/login');
      return;
    }

    // Set stream as active and store the stream ID
    setIsActive(true);
    setLiveStreamId(streamId);
    setIsInitialized(true);

    console.log('LiveRoom initialized:', { 
      streamId, 
      isHost, 
      userId: currentUser._id,
      username: currentUser.username 
    });

    // Cleanup on unmount
    return () => {
      console.log('LiveRoom cleanup');
      setIsActive(false);
    };
  }, [streamId, currentUser, navigate, setIsActive, setLiveStreamId]);

  const {
    stream,
    comments,
    viewers,
    isLoading,
    error,
    videoRef,
    sendComment,
    endStream,
    toggleMute,
    toggleVideo,
    isAudioMuted,
    isVideoDisabled,
  } = useLiveStream(isHost, streamId!, isInitialized && isActive);

  // Handle stream end
  const handleEndStream = () => {
    endStream();
    navigate('/home');
  };

  // Handle stream errors
  useEffect(() => {
    if (error) {
      console.error('Live stream error:', error);
      // You might want to show a toast notification here
    }
  }, [error]);

  // Loading state
  if (!isInitialized || !streamId || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4">Initializing...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center text-white max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Stream Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/home')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('LiveRoom render:', { 
    streamId, 
    isHost, 
    isActive: isInitialized && isActive,
    comments: comments.length,
    viewers,
    hasStream: !!stream,
    isLoading,
    error 
  });

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/home')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold">
            {isHost ? 'Your Live Stream' : 'Live Stream'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Viewer count */}
          <div className="flex items-center space-x-2 bg-red-500 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{viewers} viewers</span>
          </div>

          {/* Host controls */}
          {isHost && (
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className={`p-2 rounded ${
                  isAudioMuted ? 'bg-red-500' : 'bg-gray-600'
                } hover:opacity-80 transition-opacity`}
                title={isAudioMuted ? 'Unmute' : 'Mute'}
              >
                {isAudioMuted ? '🔇' : '🎤'}
              </button>
              
              <button
                onClick={toggleVideo}
                className={`p-2 rounded ${
                  isVideoDisabled ? 'bg-red-500' : 'bg-gray-600'
                } hover:opacity-80 transition-opacity`}
                title={isVideoDisabled ? 'Enable Video' : 'Disable Video'}
              >
                {isVideoDisabled ? '📹' : '📷'}
              </button>
              
              <button
                onClick={handleEndStream}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
              >
                End Stream
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Video player */}
        <div className="flex-1 relative">
          <LiveVideoPlayer 
            stream={stream} 
            isHost={isHost}
            videoRef={videoRef}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Comments sidebar */}
        <div className="w-80 bg-gray-900 flex flex-col">
          <LiveComments 
            comments={comments} 
            onSend={sendComment}
            currentUser={currentUser}
          />
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4">
              {isHost ? 'Starting your stream...' : 'Connecting to stream...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveRoom;
