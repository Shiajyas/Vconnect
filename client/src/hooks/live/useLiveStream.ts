import { useEffect, useRef, useState } from 'react';
import mediaSocket from '@/utils/mediaSocket';
import { createSendTransport, createRecvTransport, closeTransports } from '@/services/mediaSoup';
import { useLiveStore } from '@/appStore/useLiveStore';

const useLiveStream = (isHost: boolean, streamId: string, active: boolean) => {
  const [comments, setComments] = useState<string[]>([]);
  const [viewers, setViewers] = useState<number>(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const setLive = useLiveStore((s) => s.setIsLive);

  // Stream lifecycle events
  useEffect(() => {
    if (!active) return;

    const joinPayload = { streamId };

    mediaSocket.emit(isHost ? 'live:started' : 'live:joined', joinPayload);
    if (isHost) setLive(true);

    const handleComment = (msg: string) => {
      setComments((prev) => [...prev, msg]);
    };

    const handleViewers = (count: number) => {
      setViewers(count);
    };

    mediaSocket.on('stream:comment', handleComment);
    mediaSocket.on('stream:viewers', handleViewers);

    return () => {
      mediaSocket.emit('live:left', { streamId });
      mediaSocket.off('stream:comment', handleComment);
      mediaSocket.off('stream:viewers', handleViewers);

      setLive(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      closeTransports();
    };
  }, [isHost, streamId, active]);

  // Media stream setup
  useEffect(() => {
    if (!active) return;

    const setupStream = async () => {
      try {
        if (isHost) {
          const localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          setStream(localStream);
          streamRef.current = localStream;
          await createSendTransport(mediaSocket, localStream);
        } else {
          await createRecvTransport(mediaSocket, streamId, videoRef);
        }
      } catch (error) {
        console.error('Error setting up stream:', error);
      }
    };

    setupStream();
  }, [isHost, streamId, active]);

  const sendComment = (text: string) => {
    mediaSocket.emit('stream:comment', { streamId, message: text });
  };

  return {
    stream,
    viewers,
    comments,
    sendComment,
    videoRef,
  };
};

export default useLiveStream;
