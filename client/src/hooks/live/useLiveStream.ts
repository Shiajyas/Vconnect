import { useEffect, useRef, useState } from 'react';
import mediaSocket from '@/utils/mediaSocket';
import { createSendTransport, createRecvTransport, closeTransports } from '@/services/mediaSoup';
import { useLiveStore } from '@/appStore/useLiveStore';

const useLiveStream = (isHost: boolean, streamId: string, active: boolean) => {
  const [comments, setComments] = useState<string[]>([]);
  const [viewers, setViewers] = useState<number>(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const setLive = useLiveStore((s) => s.setIsLive);

  // Stream lifecycle events
  useEffect(() => {
    if (!active || !streamId) return;

    console.log(`Setting up live stream - Host: ${isHost}, StreamId: ${streamId}`);

    // Join the stream room
    const joinPayload = { streamId };
    mediaSocket.emit(isHost ? 'live:join' : 'live:join', joinPayload);

    if (isHost) {
      setLive(true);
    }

    const handleComment = (msg: string) => {
      console.log('Received comment:', msg);
      setComments((prev) => [...prev, msg]);
    };

    const handleViewers = (count: number) => {
      console.log('Viewer count updated:', count);
      setViewers(count);
    };

    const handleStreamEnded = () => {
      console.log('Stream ended by host');
      setLive(false);
      setError('Stream has ended');
      cleanup();
    };

    // Use correct event names that match your socket implementation
    mediaSocket.on('live:comment', handleComment);
    mediaSocket.on('live:viewers', handleViewers);
    mediaSocket.on('live:ended', handleStreamEnded);

    return () => {
      console.log('Cleaning up live stream');
      
      // Leave the stream room
      mediaSocket.emit('live:leave', { streamId });
      
      // Remove event listeners
      mediaSocket.off('live:comment', handleComment);
      mediaSocket.off('live:viewers', handleViewers);
      mediaSocket.off('live:ended', handleStreamEnded);
      
      setLive(false);
      cleanup();
    };
  }, [isHost, streamId, active, setLive]);

  // Media stream setup
  useEffect(() => {
    if (!active || !streamId) return;

    const setupStream = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isHost) {
          console.log('Setting up host stream...');
          
          // Get user media first
          const localStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
          });

          console.log('Local stream obtained:', localStream);
          
          setStream(localStream);
          streamRef.current = localStream;

          // Display local video
          if (videoRef.current) {
            videoRef.current.srcObject = localStream;
            videoRef.current.muted = true; // Mute local video to prevent feedback
            await videoRef.current.play();
          }

          // Create send transport and start producing
          await createSendTransport(mediaSocket, localStream, streamId);
          console.log('Send transport created successfully');
          
        } else {
          console.log('Setting up viewer stream...');
          
          // Create receive transport and start consuming
          await createRecvTransport(mediaSocket, streamId, videoRef);
          console.log('Receive transport created successfully');
        }
      } catch (error) {
        console.error('Error setting up stream:', error);
        setError(error instanceof Error ? error.message : 'Failed to setup stream');
      } finally {
        setIsLoading(false);
      }
    };

    setupStream();
  }, [isHost, streamId, active]);

  const cleanup = () => {
    console.log('Performing cleanup...');
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Close MediaSoup transports
    closeTransports();
    
    setStream(null);
  };

  const sendComment = (text: string) => {
    if (!text.trim()) return;
    
    console.log('Sending comment:', text);
    mediaSocket.emit('live:comment', { streamId, message: text });
  };

  const endStream = () => {
    if (isHost) {
      console.log('Ending stream...');
      mediaSocket.emit('live:end', { streamId });
      setLive(false);
      cleanup();
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('Audio muted:', !audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log('Video disabled:', !videoTrack.enabled);
      }
    }
  };

  return {
    stream,
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
