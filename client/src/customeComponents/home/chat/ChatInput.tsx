import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Smile, X } from "lucide-react";
import useChatSockets from "@/hooks/chatHooks/useChatSocket";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

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

const ChatInput: React.FC<ChatInputProps> = ({
  chatId,
  userId,
  darkMode,
  replyTo,
  editMode,
  setReplyTo,
  setEditMode,
  forEditMessage
}) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, handleTyping,editMessage } = useChatSockets(chatId, userId);
  // console.log("Editing message:", editMode?._id, message.trim(),"<<<<<<<<<<<<>>>>>>>>>>>>>>>><");

  useEffect(() => {
    if (replyTo) setMessage(replyTo.content);
    if (editMode) setMessage(editMode.content);
  }, [replyTo, editMode]);

  // Handle clicks outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSend = () => {
    if (message.trim()) {
      if (editMode) {
        editMessage(editMode?._id, message.trim());
        setEditMode(null);
      } else {
        sendMessage(message.trim(), replyTo);
        setReplyTo(null);
      }
      setMessage("");
    }
  };

  // Handle Enter key press (Shift + Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      onSend();
    }
  };

  return (
    <div className={`relative p-3 flex items-center w-full rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
      {/* Reply Message UI */}
      {replyTo && (
        <div className="absolute top-0 left-0 w-full mx-0 my-0 bg-gray-200 text-sm">
          Replying to: {replyTo.content}
          <X className="inline w-4 h-4 ml-2 cursor-pointer" onClick={() => setReplyTo(null)} />
        </div>
      )}

      {/* Emoji Picker */}
      <div ref={emojiPickerRef} className="relative">
        <Button onClick={() => setShowEmojiPicker((prev) => !prev)}>
          <Smile />
        </Button>
        {showEmojiPicker && (
          <div className="absolute bottom-14 left-0">
            <Picker
              data={data}
              onEmojiSelect={(emoji: any) => setMessage((prev) => prev + emoji.native)}
            />
          </div>
        )}
      </div>

      {/* Input Field */}
      <Input
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown} // Send message on Enter key press
        onFocus={() => setShowEmojiPicker(false)}
      />

      {/* Send Button (Enable only when message is not empty) */}
      <Button onClick={onSend} disabled={!message.trim()}>
        <Send />
      </Button>
    </div>
  );
};

export default ChatInput;
