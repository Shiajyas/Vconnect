import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Smile } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface ChatInputProps {
  sendMessage: (message: string) => void;
  handleTyping: () => void;
  darkMode: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ sendMessage, handleTyping, darkMode }) => {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const onSend = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
    handleTyping();
  };

  return (
    <div className={`relative p-3 border-t flex items-center ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white"}`}>
      <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all" onClick={() => setShowEmojiPicker((prev) => !prev)}>
        <Smile className={`w-6 h-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`} />
      </button>

      {showEmojiPicker && (
        <div className="absolute bottom-14 left-2 bg-white shadow-md rounded-lg">
          <Picker data={data} onEmojiSelect={(emoji: any) => setNewMessage((prev) => prev + emoji.native)} />
        </div>
      )}

      <Input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className={`flex-grow mx-2 border rounded-lg px-3 py-2 ${darkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}
      />

      <Button onClick={onSend} className={`p-2 ${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-500 hover:bg-blue-600"}`}>
        <Send className="w-5 h-5 text-white" />
      </Button>
    </div>
  );
};

export default ChatInput;
