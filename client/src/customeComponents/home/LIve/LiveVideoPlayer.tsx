import React, { useEffect } from 'react';

interface LiveVideoPlayerProps {
  stream: MediaStream | null;
  isHost: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  isLoading?: boolean;
  error?: string | null;
}

const LiveVideoPlayer: React.FC<LiveVideoPlayerProps> = ({
  stream,
  isHost,
  videoRef,
  isLoading = false,
  error = null,
}) => {
  // Attach the media stream to the video element whenever it changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted={isHost} // Host is muted to avoid audio feedback
        controls={false}
        aria-label={isHost ? 'Your live stream video' : 'Live stream video'}
      />

      {/* Placeholder when no stream and no loading or error */}
      {!stream && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
          <div className="text-center select-none">
            <div className="text-6xl mb-4">📺</div>
            <p className="text-xl">
              {isHost ? 'Setting up your camera...' : 'Waiting for stream...'}
            </p>
          </div>
        </div>
      )}

      {/* Live status overlay */}
      {stream && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded select-none">
          <span className="text-sm" aria-live="polite">
            {isHost ? '🔴 LIVE' : '👁️ Watching'}
          </span>
        </div>
      )}
    </div>
  );
};

export default LiveVideoPlayer;
