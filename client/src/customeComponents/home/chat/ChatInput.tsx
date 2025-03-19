import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  sendMessage: (message: string) => void;
  handleTyping: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ sendMessage, handleTyping }) => {
  const [newMessage, setNewMessage] = useState("");

  const onSend = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="p-3 border-t flex gap-2">
      <Input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyPress={handleTyping}
        placeholder="Type a message..."
      />
      <Button onClick={onSend}>
        <Send className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default ChatInput;
