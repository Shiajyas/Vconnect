import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/appStore/AuthStore";
import { socket } from "@/utils/Socket";
import { Trash2, Heart, ChevronDown, ChevronUp } from "lucide-react";
import CommentInput from "./CommentInput";
import { useNavigate } from "react-router-dom";

export const CommentItem = ({ comment, replies = [] }: { comment: any; replies: any[] }) => {
  const { user } = useAuthStore();
  const [likesCount, setLikesCount] = useState<number>(comment?.likes?.length || 0);
  const [liked, setLiked] = useState<boolean>(
    Array.isArray(comment?.likes) && comment.likes.includes(user?._id)
  );
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [localReplies, setLocalReplies] = useState(replies);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false); // Track if comment is deleted

  const navigate = useNavigate();

  // console.log(comment,">>>>>>>>>>")

  useEffect(() => {
    setLocalReplies(replies);
  }, [replies]);

  // Listen for like/unlike updates
  useEffect(() => {
    const handleLikeUpdate = ({ commentId, likes }: { commentId: string; likes: string[] }) => {
      if (comment._id === commentId) {
        // console.log("Received like update:", likes); 
        // console.log("Previous likesCount:", likesCount); 
  
        setLikesCount(likes.length);
        setLiked(likes.includes(user?._id));
  
        console.log("Updated likesCount:", likes.length);
      }
    };
  
    socket.on("commentLiked", handleLikeUpdate);
    return () => {
      socket.off("commentLiked", handleLikeUpdate);
    };
  }, [comment._id, user?._id]);
  
  // Listen for comment deletion
  useEffect(() => {
    const handleDeleteUpdate = ({ commentId }: { commentId: string }) => {
      if (comment._id === commentId) {
        setDeleted(true);
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

  const handleProfileClick = () => {
    if (comment?.userId?._id) {
      navigate(`/home/profile/${comment.userId._id}`);
    }
  };

  const handleReplyClick = (commentId: string) => {
    if (selectedCommentId === commentId) {
      setShowReplyInput(!showReplyInput);
    } else {
      setShowReplyInput(true);
      setSelectedCommentId(commentId);
    }
  };

  if (deleted) return null; // Remove deleted comments immediately

  return (
    <div className="w-full">
      <div className="flex items-start p-2 space-x-3">
        <button onClick={handleProfileClick} className="focus:outline-none">
          <img
            src={comment?.userId?.avatar || "/default-avatar.png"}
            className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            alt="User"
          />
        </button>
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
