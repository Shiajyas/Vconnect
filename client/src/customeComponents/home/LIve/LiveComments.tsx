import React, { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';
import  Picker  from '@emoji-mart/react'; // import emoji picker
import { motion, AnimatePresence } from 'framer-motion';

interface LiveCommentsProps {
  comments: string[];
  onSend: (message: string) => void;
  currentUser: { username: string; avatar?: string };
}

const LiveComments: React.FC<LiveCommentsProps> = ({ comments, onSend, currentUser }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Insert emoji at the current cursor position
  const addEmoji = (emojiData: { native: string }) => {
    const emoji = emojiData.native;
    if (inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newMessage =
        message.substring(0, start) + emoji + message.substring(end);
      setMessage(newMessage);

      // Set cursor position after the new emoji
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setMessage(message + emoji);
    }
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed) {
      onSend(trimmed);
      setMessage('');
      setShowEmojiPicker(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-md border-l border-gray-200 relative">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white/90 z-20">
        <h3 className="text-gray-800 font-semibold">Live Chat</h3>
        <p className="text-gray-500 text-sm">{comments.length} message{comments.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Comments List */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 p-4 overflow-y-auto max-h-full space-y-3 pointer-events-none">
          <AnimatePresence initial={false}>
            {comments.map((comment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-gray-300 shadow-sm rounded-lg px-4 py-2 max-w-[90%] pointer-events-auto break-words"
                aria-live="polite"
              >
                <p className="text-sm text-gray-800">{comment}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-30 shadow-lg rounded-lg">
          <Picker
            onEmojiSelect={addEmoji}
            theme="light"
            emojiButton={false}
            emojiSize={24}
            style={{ width: '300px', maxHeight: '350px' }}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 bg-white z-20 flex items-center space-x-2 relative">
  {/* Left side: emoji + input */}
  <div className="flex items-center space-x-2 flex-1 min-w-0">
    <button
      type="button"
      className={`text-gray-500 hover:text-blue-500 transition-colors ${
        showEmojiPicker ? 'text-blue-500' : ''
      }`}
      aria-label="Toggle emoji picker"
      onClick={() => setShowEmojiPicker((v) => !v)}
    >
      <Smile size={22} />
    </button>
    <input
      ref={inputRef}
      type="text"
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Say something..."
      className="flex-1 bg-gray-100 text-gray-800 px-3 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none min-w-0"
      maxLength={200}
      aria-label="Type your message"
      autoComplete="off"
    />
  </div>

  {/* Right side: send button */}
  <button
    type="button"
    onClick={handleSend}
    disabled={!message.trim()}
    className="w-1/2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition"
    aria-disabled={!message.trim()}
  >
    Send
  </button>

  <p className="text-gray-400 text-xs mt-1 select-none absolute right-4 bottom-12">
    {message.length}/200 characters
  </p>
</div>

    </div>
  );
};

export default LiveComments;
