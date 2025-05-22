import { Phone, Video } from 'lucide-react';
import React from 'react';

interface CallActionButtonsProps {
  onStartCall: (type: 'voice' | 'video') => void;
  compact?: boolean;
}

export const CallActionButtons: React.FC<CallActionButtonsProps> = ({
  onStartCall,
  compact = false,
}) => {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onStartCall('voice')}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-100 hover:bg-blue-500 hover:text-white transition"
        title="Start Voice Call"
      >
        <Phone className="w-5 h-5" />
        {!compact && <span className="hidden sm:inline">Voice</span>}
      </button>
      <button
        onClick={() => onStartCall('video')}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-100 hover:bg-green-500 hover:text-white transition"
        title="Start Video Call"
      >
        <Video className="w-5 h-5" />
        {!compact && <span className="hidden sm:inline">Video</span>}
      </button>
    </div>
  );
};
