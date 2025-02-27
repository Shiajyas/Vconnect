import React from "react";
import { io } from "socket.io-client";

interface Comment {
  _id: string;
  userId: { _id: string; fullname: string; avatar: string };
  content: string;
  replies?: Comment[];
}

const socket = io(import.meta.env.VITE_SOCKET_URL);

const CommentItem = ({ comment }: { comment: Comment }) => {
  const handleDelete = () => {
    socket.emit("deleteComment", comment._id);
  };

  return (
    <div className="flex items-start space-x-2 mt-3">
      <img src={comment.userId.avatar} alt={comment.userId.fullname} className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <p className="text-sm font-semibold">{comment.userId.fullname}</p>
        <p className="text-gray-600">{comment.content}</p>
        <button className="text-xs text-red-500" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default CommentItem;
