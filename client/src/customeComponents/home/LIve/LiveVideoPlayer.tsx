import { useEffect, useRef } from 'react';

const LiveVideoPlayer = ({ stream, isHost }: { stream: MediaStream | null; isHost: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full aspect-video">
      <video
        ref={videoRef}
        autoPlay
        muted={isHost}
        playsInline
        className="rounded-xl w-full h-full object-cover"
      />
    </div>
  );
};

export default LiveVideoPlayer;
