import React from 'react';

interface LiveRoomLayoutProps {
  children: React.ReactNode;
}

const LiveRoomLayout: React.FC<LiveRoomLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white">
      {children}
    </div>
  );
};

export default LiveRoomLayout;
