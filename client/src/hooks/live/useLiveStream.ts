import { useEffect, useRef, useState } from 'react';
import mediaSocket from '@/utils/mediaSocket';
import { createSendTransport, createRecvTransport, closeTransports } from '@/services/mediaSoup';
import { useLiveStore } from '@/appStore/useLiveStore';

const useLiveStream = (isHost: boolean, streamId: string, active: boolean) => {
  const [comments, setComments] = useState<string[]>([]);
  const [viewers, setViewers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Zustand setters & getters
  const setLive = useLiveStore((s) => s.setIsLive);
  const setStream = useLiveStore((s) => s.setStream);

  // Lifecycle: join/leave stream room & socket listeners
  useEffect(() => {
    if (!active || !streamId) return;

    console.log(`[LiveStream] Joining stream room (Host: ${isHost}) StreamID: ${streamId}`);

    mediaSocket.emit('live:join', { streamId });

    if (isHost) setLive(true);

    const onComment = (msg: string) => {
      console.log('[LiveStream] New comment:', msg);
      setComments((prev) => [...prev, msg]);
    };

    const onViewers = (count: number) => {
      console.log('[LiveStream] Viewer count:', count);
      setViewers(count);
    };

    const onStreamEnded = () => {
      console.log('[LiveStream] Stream ended by host');
      setLive(false);
      setError('Stream has ended');
      cleanup();
    };

    mediaSocket.on('live:comment', onComment);
    mediaSocket.on('live:viewers', onViewers);
    mediaSocket.on('live:ended', onStreamEnded);

    return () => {
      console.log('[LiveStream] Leaving stream room & cleaning up');

      mediaSocket.emit('live:leave', { streamId });

      mediaSocket.off('live:comment', onComment);
      mediaSocket.off('live:viewers', onViewers);
      mediaSocket.off('live:ended', onStreamEnded);

      setLive(false);
      cleanup();
    };
  }, [isHost, streamId, active, setLive]);

  // Setup or receive MediaStream depending on role
  useEffect(() => {
    if (!active || !streamId) return;

    const setupStream = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isHost) {
          console.log('[LiveStream] Host getting user media...');
          const localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, frameRate: 30 },
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });

          console.log('[LiveStream] Local stream obtained');
          streamRef.current = localStream;
          setStream(localStream);

          if (videoRef.current) {
            videoRef.current.srcObject = localStream;
            videoRef.current.muted = true; // mute self to avoid echo
            await videoRef.current.play();
          }

          await createSendTransport(mediaSocket, localStream, streamId);
          console.log('[LiveStream] Send transport created');

        } else {
          console.log('[LiveStream] Viewer creating receive transport...');
          await createRecvTransport(mediaSocket, streamId, videoRef, setStream);

          // createRecvTransport should internally set the videoRef.srcObject to the remote MediaStream
          // If you want to track this stream globally:
          if (videoRef.current?.srcObject) {
            streamRef.current = videoRef.current.srcObject as MediaStream;
            setStream(streamRef.current);
          }
          console.log('[LiveStream] Receive transport created');
        }
      } catch (err) {
        console.error('[LiveStream] Error setting up stream:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup stream');
      } finally {
        setIsLoading(false);
      }
    };

    setupStream();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, streamId, active]);

  // Cleanup function stops media tracks, resets state, and closes transports
  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`[LiveStream] Stopped ${track.kind} track`);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    closeTransports();
    setStream(null);

    useLiveStore.getState().removeLiveStream(streamId);

  };

  // Send chat comment to server
  const sendComment = (text: string) => {
    if (!text.trim()) return;
    console.log('[LiveStream] Sending comment:', text);
    mediaSocket.emit('live:comment', { streamId, message: text });
  };

  // Host ends the stream
  const endStream = () => {
    if (isHost) {
      console.log('[LiveStream] Host ending stream...');
      mediaSocket.emit('live:end', { streamId });
      setLive(false);
      cleanup();
    }
  };

  // Mute/unmute audio track
  const toggleMute = () => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      console.log(`[LiveStream] Audio ${audioTrack.enabled ? 'unmuted' : 'muted'}`);
    }
  };

  // Enable/disable video track
  const toggleVideo = () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      console.log(`[LiveStream] Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
    }
  };

  return {
    stream: streamRef.current,
    viewers,
    comments,
    isLoading,
    error,
    videoRef,
    sendComment,
    endStream,
    toggleMute,
    toggleVideo,
    isAudioMuted: streamRef.current?.getAudioTracks()[0]?.enabled === false,
    isVideoDisabled: streamRef.current?.getVideoTracks()[0]?.enabled === false,
  };
};

export default useLiveStream;
