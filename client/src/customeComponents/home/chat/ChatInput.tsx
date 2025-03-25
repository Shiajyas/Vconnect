import React, { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Smile } from "lucide-react";
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
  editMessage: (id: string, newContent: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ chatId, userId, darkMode, replyTo, editMode, setReplyTo, setEditMode, editMessage }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { sendMessage, handleTyping } = useChatSockets(chatId, userId);

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (replyTo) setMessage(`Replying to: ${replyTo.content}`);
    if (editMode) setMessage(editMode.content);
  }, [replyTo, editMode]);

  const handleTypingWithDebounce = useCallback(() => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      handleTyping();
    }, 1000);
  }, []);

  const addEmoji = (emoji: any) => {
    setMessage((prev) => prev + emoji.native);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const onSend = () => {
    if (message.trim()) {
      if (editMode) {
        editMessage(editMode._id, message.trim());
        setEditMode(null);
      } else {
        setMessage("");
        sendMessage(message.trim());
        setReplyTo(null);
      }
      setMessage("");
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className={`relative p-3 flex items-center w-full rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
      <div className="relative" ref={emojiPickerRef}>
        <Button onClick={() => setShowEmojiPicker((prev) => !prev)} className="p-2">
          <Smile className="w-5 h-5" />
        </Button>
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 z-50 mb-2">
            <Picker data={data} onEmojiSelect={addEmoji} theme={darkMode ? "dark" : "light"} />
          </div>
        )}
      </div>

      <Input
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          handleTypingWithDebounce();
        }}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), onSend())}
        className="flex-grow mx-2"
      />

      <Button onClick={onSend}>
        <Send className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default ChatInput;
