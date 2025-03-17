import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/utils/Socket";
import { useGetComments } from "@/hooks/useComment";
import CommentList from "./CommentList";
import CommentInput from "./CommentInput";
import { X } from "lucide-react";

const MAX_VISIBLE_COMMENTS = 5;

const CommentSection = ({ postId, onClose }: { postId: string; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const { data } = useGetComments(postId);
  const comments = data?.pages.flatMap((page) => page) || [];

  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    setIsFixed(comments.length > MAX_VISIBLE_COMMENTS);

    socket.emit("joinPostRoom", postId);

    const handleNewComment = () => queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    const handleNewReply = () => queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    const handleDeleteComment = () => queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    const handleCommentLiked = () => queryClient.invalidateQueries({ queryKey: ["comments", postId] });

    socket.on("newComment", handleNewComment);
    socket.on("newReply", handleNewReply);
    socket.on("delete_comment", handleDeleteComment);
    socket.on("commentLiked", handleCommentLiked);
    socket.on("delete_reply", handleNewReply);
    return () => {
      socket.emit("leavePostRoom", postId);
      socket.off("newComment", handleNewComment);
      socket.off("newReply", handleNewReply);
      socket.off("delete_comment", handleDeleteComment);
      socket.off("commentLiked", handleCommentLiked);
      socket.on("delete_reply", handleNewReply);
    };
  }, [postId, queryClient, comments.length]);

  return (
    <div className="relative w-full  bg-white shadow-md rounded-lg"
    onClick={(e) => e.stopPropagation()} 
    >
      {/* Mobile View */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white shadow-lg rounded-t-lg z-50">
        <div className="flex justify-between items-center p-2 border-b bg-gray-100">
          <span className="font-semibold text-gray-800">Comments</span>
          <button onClick={onClose} className="text-gray-600 hover:text-black p-1">
            <X size={24} />
          </button>
        </div>

        <div className="h-[80vh] overflow-y-auto p-2">
          {comments.length > 0 ? (
            <CommentList comments={comments} />
          ) : (
            <p className="text-gray-500 text-center mt-4">Be the first to comment!</p>
          )}
        </div>

        <div className="p-2 border-t bg-gray-100">
          <CommentInput postId={postId} />
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block p-4 bg-gray-100 rounded-lg shadow-md w-full">
        <h3 className="font-semibold text-lg mb-2">Comments</h3>

        <div
          className={`p-2 bg-white rounded-md shadow-sm overflow-y-auto transition-all duration-300 ${
            isFixed ? "h-96" : "max-h-[80vh]"
          }`}
        >
          {comments.length > 0 ? (
            <CommentList comments={comments} />
          ) : (
            <p className="text-gray-500 text-center mt-4">Be the first to comment!</p>
          )}
        </div>

        <div className="p-2 border-t mt-2">
          <CommentInput  postId={postId} />
        </div>
      </div>
    </div>
  );
};

export default CommentSection;

