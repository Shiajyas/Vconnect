import React, { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/utils/Socket";
import { useGetComments } from "@/hooks/useComment";
import CommentList from "./CommentList";
import CommentInput from "./CommentInput";
import { X } from "lucide-react";

const CommentSection = ({ postId, onClose }: { postId: string; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const { data } = useGetComments(postId);
  const comments = data?.pages.flatMap((page) => page) || [];

  useEffect(() => {
    socket.emit("joinPostRoom", postId);

    // Handle new comments
    const handleNewComment = (newComment: any) => {
      // queryClient.setQueryData(["comments", postId], (oldData: any) => {
      //   if (!oldData) return { pages: [[newComment]] };
      //   return {
      //     ...oldData,
      //     pages: [[newComment, ...oldData.pages[0]], ...oldData.pages.slice(1)],
      //   };
      // });
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    };

    // Handle new replies
    const handleNewReply = (newReply: any) => {
      queryClient.setQueryData(["comments", postId], (oldData: any) => {
        if (!oldData) return { pages: [] };
    
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) =>
            page.map((comment: any) => {
              if (comment._id === newReply.parentCommentId) {
                return {
                  ...comment,
                  replies: comment.replies
                    ? [...comment.replies, newReply]
                    : [newReply],
                };
              }
              return comment;
            })
          ),
        };
      });
    };
    
    

    // Handle comment deletion
    const handleDeleteComment = (commentId: string) => {

      console.log("try to delete>>>>>>>>>>>>>>>>>")
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    };

    // Handle likes
    const handleCommentLiked = ({ commentId, likes }: { commentId: string; likes: number }) => {
      queryClient.setQueryData(["comments", postId], (oldData: any) => {
        if (!oldData) return { pages: [] };
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) =>
            page.map((comment: any) =>
              comment._id === commentId ? { ...comment, likes } : comment
            )
          ),
        };
      });
    };

    socket.on("newComment", handleNewComment);
    socket.on("newReply", handleNewReply);
    socket.on("delete_comment", handleDeleteComment);
    socket.on("commentLiked", handleCommentLiked);

    return () => {
      socket.emit("leavePostRoom", postId);
      socket.off("newComment", handleNewComment);
      socket.off("newReply", handleNewReply);
      socket.off("delete_comment", handleDeleteComment);
      socket.off("commentLiked", handleCommentLiked);
    };
  }, [postId, queryClient]);

  return (
    <div className="relative w-full md:w-[600px] bg-white shadow-md rounded-lg">
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white shadow-lg rounded-t-lg z-50">
        <div className="flex justify-between items-center p-2 border-b bg-gray-100">
          <span className="font-semibold text-gray-800">Comments</span>
          <button onClick={onClose} className="text-gray-600 hover:text-black p-1">
            <X size={24} />
          </button>
        </div>

        <div className="h-[80vh] overflow-y-auto p-2">
          <CommentList comments={comments} />
        </div>

        <div className="p-2 border-t bg-gray-100">
          <CommentInput postId={postId} />
        </div>
      </div>

      <div className="hidden md:block p-4 bg-gray-100 rounded-lg shadow-md w-full">
        <h3 className="font-semibold text-lg mb-2">Comments</h3>
        <div className="h-96 overflow-y-auto p-2 bg-white rounded-md shadow-sm">
          <CommentList comments={comments} />
        </div>
        <div className="p-2 border-t mt-2">
          <CommentInput postId={postId} />
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
