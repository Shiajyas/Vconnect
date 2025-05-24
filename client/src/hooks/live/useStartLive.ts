import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveStore } from '@/appStore/useLiveStore';
import mediaSocket from '@/utils/mediaSocket';
import { v4 as uuidv4 } from 'uuid';

export const useStartLive = (userId?: string) => {
  const [isStarting, setIsStarting] = useState(false);
  const navigate = useNavigate();
  const setLiveStreamId = useLiveStore((state) => state.setLiveStreamId);
  const setIsLive = useLiveStore((state) => state.setIsLive);

  const startLive = async () => {
    if (!userId) {
      console.error('Cannot start live: userId is required');
      return;
    }

    if (isStarting) {
      console.log('Live stream is already starting...');
      return;
    }

    setIsStarting(true);

    try {
      // Generate a unique stream ID
      const streamId = `stream_${userId}_${uuidv4()}`;
      
      console.log('Starting live stream with ID:', streamId);

      // Set the stream ID in the store
      setLiveStreamId(streamId);

      // Emit live:start event to the server
      mediaSocket.emit('live:start', {
        streamId,
        userId
      });

      // Set live state
      setIsLive(true);

      // Navigate to the live stream page
      navigate(`/home/live/${streamId}`);

      console.log('Live stream started successfully');
    } catch (error) {
      console.error('Failed to start live stream:', error);
      setIsLive(false);
      setLiveStreamId('');
      throw error;
    } finally {
      setIsStarting(false);
    }
  };

  return {
    startLive,
    isStarting
  };
};
