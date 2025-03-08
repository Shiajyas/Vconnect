import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/context/AuthContext";
import { socket } from "@/utils/Socket";
import { Trash2, Heart, ChevronDown, ChevronUp } from "lucide-react";
import CommentInput from "./CommentInput";

export const CommentItem = ({ comment, replies = [] }: { comment: any; replies: any[] }) => {
  const { user } = useAuthStore();
  const [likesCount, setLikesCount] = useState<number>(comment?.likes?.length || 0);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [localReplies, setLocalReplies] = useState(replies);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [liked, setLiked] = useState<boolean>(
    Array.isArray(comment?.likes) && comment.likes.includes(user?._id)
  );
  const [deleted, setDeleted] = useState(false); // Track if comment is deleted

  useEffect(() => {
    setLocalReplies(replies);
  }, [replies]);

  useEffect(() => {
    const handleLikeUpdate = ({ commentId, likes }: { commentId: string; likes: string[] }) => {
      if (comment._id === commentId) {
        setLiked(likes.includes(user?._id));
        setLikesCount(likes.length);
      }
    };

    socket.on("commentLiked", handleLikeUpdate);
    return () => {
      socket.off("commentLiked", handleLikeUpdate);
    };
  }, [comment._id, user?._id]);

  useEffect(() => {
    const handleDeleteUpdate = ({ commentId }: { commentId: string }) => {
      if (comment._id === commentId) {
        setDeleted(true); // Mark as deleted
      } else {
        setLocalReplies((prevReplies) => prevReplies.filter((reply) => reply._id !== commentId));
      }
    };

    socket.on("delete_comment", handleDeleteUpdate);
    return () => {
      socket.off("delete_comment", handleDeleteUpdate);
    };
  }, [comment._id]);

  const handleLikeToggle = () => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1));

    socket.emit(newLikedState ? "likeComment" : "unLikeComment", {
      commentId: comment._id,
      userId: user?._id,
    });
  };

  const handleDelete = () => {
    socket.emit("deleteComment", { commentId: comment._id });
  };

  const handleReplyClick = (commentId: string) => {
    if (selectedCommentId === commentId) {
      setShowReplyInput(!showReplyInput);
    } else {
      setShowReplyInput(true);
      setSelectedCommentId(commentId);
    }
  };

  if (deleted) return null; // Remove comment from UI immediately

  return (
    <div className="w-full">
      <div className="flex items-start p-2 space-x-3">
        <img
          src={comment?.userId?.avatar || "/default-avatar.png"}
          className="w-8 h-8 rounded-full"
          alt="User"
        />
        <div className="bg-gray-100 p-3 rounded-lg w-full shadow-sm">
          <p className="text-sm font-medium">{comment?.content || "Comment unavailable"}</p>

          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-600">
            {/* Like Button */}
            <button
              onClick={handleLikeToggle}
              className={`flex items-center gap-1 transition-colors duration-200 ${
                liked ? "text-red-500 hover:text-red-700" : "hover:text-gray-700"
              }`}
            >
              <Heart size={16} /> <span>{likesCount}</span>
            </button>

            {/* Reply Button */}
            <button
              onClick={() => handleReplyClick(comment._id)}
              className="flex items-center gap-1 hover:text-blue-500 transition-colors duration-200"
            >
              <span>Reply</span>
            </button>

            {/* Show/Hide Replies Button */}
            {localReplies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors duration-200"
              >
                {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>{showReplies ? "Hide Replies" : `Show Replies (${localReplies.length})`}</span>
              </button>
            )}

            {/* Delete Button */}
            {comment?.userId?._id === user?._id && (
              <button
                onClick={handleDelete}
                className="text-red-500 flex items-center gap-1 hover:text-red-700 transition-colors duration-200"
              >
                <Trash2 size={16} /> <span>Delete</span>
              </button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && selectedCommentId === comment._id && (
            <div className="pl-8 mt-2">
              <CommentInput
                postId={comment?.postId}
                parentId={comment?._id}
                onReplySent={() => {
                  setShowReplyInput(false);
                  setSelectedCommentId(null);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Replies Section */}
      {showReplies && localReplies.length > 0 && (
        <div className="pl-8 mt-2 border-l border-gray-300">
          {localReplies.map((reply) => (
            <CommentItem key={reply._id} comment={reply} replies={reply.replies || []} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;