import React from 'react';

interface LiveVideoPlayerProps {
  stream: MediaStream | null;
  isHost: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  isLoading?: boolean;
  error?: string | null;
}

const LiveVideoPlayer = ({ 
  stream, 
  isHost, 
  videoRef, 
  isLoading, 
  error 
}: LiveVideoPlayerProps) => {
  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted={isHost} // Mute for host to prevent feedback
        controls={false}
      />

      {/* Placeholder when no stream */}
      {!stream && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">📺</div>
            <p className="text-xl">
              {isHost ? 'Setting up your camera...' : 'Waiting for stream...'}
            </p>
          </div>
        </div>
      )}

      {/* Stream info overlay */}
      {stream && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
          <span className="text-sm">
            {isHost ? '🔴 LIVE' : '👁️ Watching'}
          </span>
        </div>
      )}
    </div>
  );
};

export default LiveVideoPlayer;
