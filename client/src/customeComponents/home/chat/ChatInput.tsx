import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Smile, X, Paperclip } from 'lucide-react';
import useChatSockets from '@/hooks/chatHooks/useChatSocket';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface ChatInputProps {
  chatId: string;
  userId: string;
  darkMode: boolean;
  replyTo?: any;
  editMode?: any;
  setReplyTo: (msg: any | null) => void;
  setEditMode: (msg: any | null) => void;
  forEditMessage: (id: string, newContent: string) => void;
}

type FileWithStatus = {
  file: File;
  status: 'pending' | 'uploading' | 'sent' | 'failed';
};

const ChatInput: React.FC<ChatInputProps> = ({
  chatId,
  userId,
  darkMode,
  replyTo,
  editMode,
  setReplyTo,
  setEditMode,
  forEditMessage,
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { sendMessage, editMessage, sendFileMessage } = useChatSockets(chatId, userId);

  useEffect(() => {
    if (replyTo) setMessage(replyTo.content);
    if (editMode) setMessage(editMode.content);
  }, [replyTo, editMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add new files to the list with 'pending' status
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        status: 'pending' as const,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Function to send files with status updates
  const sendFilesWithStatus = async () => {
    // We create a copy of files to modify their status without mutating state directly
    let updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      try {
        // Set status to uploading
        updatedFiles[i] = { ...updatedFiles[i], status: 'uploading' };
        setFiles([...updatedFiles]);

        // Await the file send promise - assuming sendFileMessage returns a Promise
        await sendFileMessage(updatedFiles[i].file, message, replyTo);

        // On success, mark sent
        updatedFiles[i] = { ...updatedFiles[i], status: 'sent' };
        setFiles([...updatedFiles]);
      } catch (err) {
        // On error, mark failed
        updatedFiles[i] = { ...updatedFiles[i], status: 'failed' };
        setFiles([...updatedFiles]);
      }
    }
  };

  // Send handler
  const onSend = async () => {
    if (editMode) {
      editMessage(editMode._id, message.trim());
      setEditMode(null);
      setMessage('');
      setReplyTo(null);
      setFiles([]);
      return;
    }

    if (files.length > 0) {
      await sendFilesWithStatus();
      // After sending all files, clear only those that are successfully sent
      setFiles((prev) => prev.filter((f) => f.status !== 'sent'));
      // Clear message and reply only if all files sent
      if (files.every((f) => f.status === 'sent')) {
        setMessage('');
        setReplyTo(null);
      }
    } else if (message.trim()) {
      sendMessage(message.trim(), replyTo);
      setMessage('');
      setReplyTo(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const isSending = files.some((f) => f.status === 'uploading');

  return (
    <div
      className={`relative p-3 mb-2 flex items-center w-full rounded-lg ${
        darkMode ? 'bg-gray-800' : 'bg-gray-100'
      }`}
    >
      {replyTo && (
        <div className="absolute top-0 left-0 w-full bg-gray-200 text-sm px-2 py-1 flex items-center justify-between">
          <span>Replying to: {replyTo.content}</span>
          <X className="inline w-4 h-4 ml-2 cursor-pointer" onClick={() => setReplyTo(null)} />
        </div>
      )}

      <div ref={emojiPickerRef} className="relative">
        <Button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          disabled={isSending}
        >
          <Smile />
        </Button>
        {showEmojiPicker && (
          <div className="absolute bottom-14 left-0 z-10">
            <Picker
              data={data}
              onEmojiSelect={(emoji: any) => setMessage((prev) => prev + emoji.native)}
            />
          </div>
        )}
      </div>

      <label className="ml-2 cursor-pointer">
        <Paperclip />
        <input
          type="file"
          className="hidden"
          multiple
          onChange={handleFileChange}
          disabled={isSending}
        />
      </label>

      {/* Preview files grid */}
      {files.length > 0 && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-10"
            onClick={() => !isSending && setFiles([])}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl z-20 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold">Files to send ({files.length})</span>
              {!isSending && <X className="w-5 h-5 cursor-pointer" onClick={() => setFiles([])} />}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {files.map(({ file, status }, idx) => (
                <div
                  key={idx}
                  className="relative border rounded-md p-2 bg-gray-50 dark:bg-gray-800 flex flex-col items-center"
                >
                  {!isSending && (
                    <button
                      className="absolute top-1 right-1 p-1 bg-black bg-opacity-40 rounded-full text-white"
                      onClick={() => removeFile(idx)}
                      disabled={isSending}
                    >
                      <X size={14} />
                    </button>
                  )}
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center text-xs text-gray-500">
                      <Paperclip className="mb-2" />
                      {file.name}
                    </div>
                  )}
                  <div className="mt-2 text-xs w-full text-center">
                    {status === 'uploading' && <span className="text-blue-600">Sending...</span>}
                    {status === 'sent' && <span className="text-green-600">Sent ✓</span>}
                    {status === 'failed' && <span className="text-red-600">Failed ✗</span>}
                    {status === 'pending' && <span className="text-gray-500">Pending</span>}
                  </div>
                </div>
              ))}
            </div>
            {/* Send button inside modal */}
            <div className="flex justify-end mt-4">
              <Button
                onClick={onSend}
                disabled={(!message.trim() && files.length === 0) || isSending}
              >
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </>
      )}

      <Input
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowEmojiPicker(false)}
        className="ml-2"
        disabled={isSending}
      />

      <Button onClick={onSend} disabled={(!message.trim() && files.length === 0) || isSending}>
        {isSending ? 'Sending...' : <Send />}
      </Button>
    </div>
  );
};

export default ChatInput;
