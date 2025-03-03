import React, { useState } from "react";
import Picker from "@emoji-mart/react";
import { Smile } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const CommentInput = ({ newComment, setNewComment }: { newComment: string; setNewComment: React.Dispatch<React.SetStateAction<string>> }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emoji: any) => {
    setNewComment((prev) => prev + emoji.native);
  };

  return (
    <div className="relative flex items-center space-x-2">
      {/* Comment Input */}
      <Textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Write a comment..."
        className="w-full resize-none rounded-full border p-2 focus:ring-2 focus:ring-blue-400"
      />

      {/* Emoji Picker Button */}
      <button onClick={() => setShowEmojiPicker((prev) => !prev)} className="text-gray-500">
        <Smile className="w-6 h-6" />
      </button>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-10 right-0 bg-white shadow-md border rounded-md">
          <Picker onEmojiSelect={handleEmojiSelect} />
        </div>
      )}
    </div>
  );
};

export default CommentInput;
