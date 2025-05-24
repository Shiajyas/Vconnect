import React, { useState, useRef, useEffect } from 'react';

interface Comment {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

interface LiveCommentsProps {
  comments: string[];
  onSend: (message: string) => void;
  currentUser: { username: string; avatar?: string };
}

const LiveComments = ({ comments, onSend, currentUser }: LiveCommentsProps) => {
  const [message, setMessage] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comments header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-semibold">Live Chat</h3>
        <p className="text-gray-400 text-sm">{comments.length} messages</p>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No comments yet.</p>
            <p className="text-sm">Be the first to say something!</p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div key={index} className="text-white">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-sm">{comment}</p>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            maxLength={200}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-1">
          {message.length}/200 characters
        </p>
      </div>
    </div>
  );
};

export default LiveComments;
