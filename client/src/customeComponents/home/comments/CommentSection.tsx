import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/context/AuthContext";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, Send } from "lucide-react";
import CommentItem from "./CommentItem";

interface Comment {
  _id: string;
  postId: string;
  userId: { _id: string; fullname: string; avatar: string };
  content: string;
  parentCommentId?: string;
  mentions?: string[];
  createdAt: string;
  replies?: Comment[];
}

const socket = io(import.meta.env.VITE_SOCKET_URL);

const CommentSection = ({ postId }: { postId: string }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [mentionList, setMentionList] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const mentionRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.emit("joinPostRoom", postId);

    socket.on("newComment", (comment: Comment) => {
      queryClient.setQueryData(["comments", postId], (oldData: Comment[] | undefined) => {
        return [...(oldData || []), comment];
      });

      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    socket.on("deleteComment", (commentId: string) => {
      queryClient.setQueryData(["comments", postId], (oldData: Comment[] | undefined) => {
        return oldData ? oldData.filter((c) => c._id !== commentId) : [];
      });
    });

    return () => {
      socket.off("newComment");
      socket.off("deleteComment");
    };
  }, [postId, queryClient]);

  // Fetch comments initially using React Query
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const res = await fetch(`/post/comments/${postId}`);
      return res.json();
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const commentData = { content: newComment, parentCommentId: replyTo || undefined, postId, userId: user?._id };
    
    socket.emit("addComment", commentData);
    setNewComment("");
    setReplyTo(null);
  };

  const handleMentionInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewComment(text);

    const match = text.match(/@(\w+)$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery("");
    }
  };

  return (
    <div className="mt-4 flex flex-col h-[450px] bg-gray-100 rounded-lg shadow-md overflow-hidden">
      {/* Comments List (Chat Box) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comments.map((comment) => (
          <div
            key={comment._id}
            className={`flex ${
              comment.userId._id === user?._id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] p-3 rounded-lg shadow-md ${
                comment.userId._id === user?._id
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              }`}
            >
              <p className="text-sm">{comment.content}</p>
              <span className="text-xs opacity-70 block mt-1">
                {new Date(comment.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>

      {/* Chat Input */}
      <div className="border-t bg-white p-3 flex items-center space-x-2">
        <img src={user?.avatar} alt="User Avatar" className="w-8 h-8 rounded-full" />
        <div className="relative flex-1">
          <Textarea
            value={newComment}
            onChange={handleMentionInput}
            placeholder="Write a comment..."
            className="w-full resize-none rounded-full border p-2 focus:ring-2 focus:ring-blue-400"
          />
          {mentionQuery && (
            <div ref={mentionRef} className="absolute bg-white border p-2 mt-1 w-full shadow-md rounded-md">
              {mentionList
                .filter((m) => m.includes(mentionQuery))
                .map((mention) => (
                  <div
                    key={mention}
                    className="cursor-pointer p-2 hover:bg-gray-200 flex items-center"
                    onClick={() => {
                      setNewComment((prev) => prev.replace(/@\w+$/, `@${mention} `));
                      setMentionQuery("");
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {mention}
                  </div>
                ))}
            </div>
          )}
        </div>
        <Button
          onClick={handleAddComment}
          className="bg-blue-500 text-white p-2 rounded-full"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;
