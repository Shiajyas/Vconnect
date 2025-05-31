import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useLiveStream from '@/hooks/live/useLiveStream';
import LiveVideoPlayer from './LiveVideoPlayer';
import LiveComments from './LiveComments';
import { useLiveStore } from '@/appStore/useLiveStore';
import { useAuthStore } from '@/appStore/AuthStore';

// Import icons from lucide-react
import { Mic, MicOff, Video, VideoOff, X } from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const LiveRoom = () => {
  const { id: streamId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isInitialized, setIsInitialized] = useState(false);

  const { user: currentUser } = useAuthStore();
  const isHost = useLiveStore((s) => s.isHost);
  const isActive = useLiveStore((s) => s.isActive);
  const setIsActive = useLiveStore((s) => s.setIsActive);
  const setLiveStreamId = useLiveStore((s) => s.setLiveStreamId);

  useEffect(() => {
    if (!streamId) {
      navigate('/home');
      return;
    }
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setIsActive(true);
    setLiveStreamId(streamId);
    setIsInitialized(true);

    return () => setIsActive(false);
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

  const handleEndStream = () => {
    endStream();
    navigate('/home');
  };

  if (!isInitialized || !streamId || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center text-gray-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4">Initializing...</p>
        </div>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center text-gray-700 max-w-md px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Stream Error</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/home')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col overflow-x-hidden" // Prevent horizontal overflow globally
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <main className="flex flex-1 flex-col md:flex-row overflow-hidden relative max-w-full w-full">
        {/* Video player container with min-w-0 to enable flex shrink */}
        <div className="flex-1 relative bg-black md:h-auto h-[50vh] flex flex-col max-w-full w-full min-w-0">
          {/* Viewers count - top right */}
          <div
            className="absolute top-4 right-4 z-50 flex items-center space-x-2 bg-red-600 bg-opacity-50 text-white px-3 py-1 rounded-full shadow-sm select-none"
            style={{ backdropFilter: 'blur(6px)' }}
          >
            <span className="animate-pulse">🔴</span>
            <span className="font-medium">{viewers} viewers</span>
          </div>

          <LiveVideoPlayer
            stream={stream}
            isHost={isHost}
            videoRef={videoRef}
            isLoading={isLoading}
            error={error}
          />

          {/* Bottom controls bar */}
          <div className="absolute bottom-4 left-4 right-4 z-50 bg-black bg-opacity-40 backdrop-blur-md rounded-xl p-3 flex items-center justify-center space-x-6 max-w-md mx-auto">
            {isHost && (
              <>
                <button
                  onClick={toggleMute}
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                    isAudioMuted ? 'bg-red-600 text-white' : 'bg-white text-black'
                  }`}
                  aria-pressed={isAudioMuted}
                  aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                    isVideoDisabled ? 'bg-red-600 text-white' : 'bg-white text-black'
                  }`}
                  aria-pressed={isVideoDisabled}
                  aria-label={isVideoDisabled ? 'Enable video' : 'Disable video'}
                >
                  {isVideoDisabled ? <VideoOff size={24} /> : <Video size={24} />}
                </button>

                <button
                  onClick={handleEndStream}
                  className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white w-12 h-12 rounded-full shadow transition-colors"
                  aria-label="End stream"
                >
                  <X size={24} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Comments panel with min-w-0 and max-w-full */}
        <aside className="w-full md:w-80 bg-white/80 backdrop-blur border-t border-gray-200 md:border-t-0 md:border-l md:overflow-hidden flex flex-col max-w-full min-w-0">
          <LiveComments comments={comments} onSend={sendComment} currentUser={currentUser} />
        </aside>
      </main>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 bg-white/70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-live="assertive"
            aria-busy="true"
          >
            <div className="text-center text-gray-800">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
              <p className="mt-4">{isHost ? 'Starting your stream...' : 'Connecting to stream...'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LiveRoom;
