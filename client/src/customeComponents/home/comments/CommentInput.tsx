import React, { useState } from "react";
import { socket } from "@/utils/Socket";
import { useAuthStore } from "@/appStore/AuthStore";
import { Send, Smile, X } from "lucide-react";
import Picker from "@emoji-mart/react";
import { useQueryClient } from "@tanstack/react-query";

const CommentInput = ({
  postId,
  parentId,
  onReplySent
}: {
  postId: string;
  parentId?: string;
  onReplySent?: () => void;
}) => {
  const { user } = useAuthStore();
  const [comment, setComment] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const queryClient = useQueryClient();

  const handleSend = async () => {
    if (!comment.trim()) return;

    const tempId = Math.random().toString(36).substr(2, 9);

    const tempComment = {
      _id: tempId,
      postId,
      content: comment,
      parentId: parentId,
      userId: {
        _id: user?._id,
        avatar: user?.avatar || "/default-avatar.png",
        name: user?.fullname || "Anonymous",
      },
      likes: [],
      createdAt: new Date().toISOString(),
    };

 
    queryClient.invalidateQueries({ queryKey: ["comments", postId] });

    socket.emit("addComment", { postId, content: comment, userId: user?._id, parentId }, (serverComment: any) => {
      if (serverComment) {

         queryClient.invalidateQueries({ queryKey: ["comments", postId] });
        if (onReplySent) onReplySent();
      }
    });

    setComment("");
  };

  return (
    <div className="flex items-center mt-2 space-x-2 w-full relative">
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a comment..."
        className="w-full border rounded-full px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-400"
      />

      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
        <Smile size={20} />
      </button>

      {showEmojiPicker && (
        <div className="absolute bottom-[60px] left-1/2 transform -translate-x-1/2 z-50 bg-white shadow-lg p-3 rounded-lg w-72">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold">Pick an emoji</span>
            <button onClick={() => setShowEmojiPicker(false)}>
              <X size={18} />
            </button>
          </div>
          <Picker onEmojiSelect={(emoji: any) => setComment((prev) => prev + emoji.native)} />
        </div>
      )}

      <button onClick={handleSend} className="bg-blue-500 text-white rounded-full p-2">
        <Send size={20} />
      </button>
    </div>
  );
};

export default CommentInput;