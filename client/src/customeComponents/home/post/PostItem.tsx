import React, { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/context/AuthContext";
import CommentSection from "../comments/CommentSection";
import { socket } from "@/utils/Socket";

interface Post {
  _id: string;
  userId: { fullname: string; avatar: string };
  description: string;
  mediaUrls?: string[];
  likes: string[];
  commendCount: number;
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onToggleComments: () => void;
  isLiked: boolean;
  isCommentsOpen: boolean;
}

const PostCard = memo(({ post, onLike, onToggleComments, isLiked, isCommentsOpen }: PostCardProps) => {
  const [localCommentCount, setLocalCommentCount] = useState(post.commendCount);

  useEffect(() => {
    const handleNewComment = (data: { postId: string }) => {
      if (data.postId === post._id) {
        setLocalCommentCount((prev) => prev + 1);
      }
    };
    
    const handleDeleteComment = (data: { postId: string }) => {
      console.log("Comment deleted event received:", data.postId);
      if (data.postId === post._id) {
        setLocalCommentCount((prev) => Math.max(prev - 1, 0)); // Ensure count never goes below 0
      }
    };

    socket.on("newComment", handleNewComment);
    socket.on("delete_comment", handleDeleteComment);


    return () => {
      socket.off("newComment", handleNewComment);
      socket.off("delete_comment", handleDeleteComment);
    };
  }, [post._id]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
      <div className="flex items-center space-x-3">
        <img src={post.userId?.avatar} alt={post.userId?.fullname} className="w-10 h-10 rounded-full" />
        <h3 className="font-semibold">{post.userId?.fullname}</h3>
      </div>
      <span className="text-gray-500 text-sm">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>

      <p className="mt-2">{post?.description}</p>

      {(post?.mediaUrls?.length ?? 0) > 0 &&
          (post?.mediaUrls?.[0] && /\.(mp4|webm|ogg)$/i.test(post?.mediaUrls[0]) ? (
            <video
              controls
              className="w-full rounded-lg mt-2"
              controlsList="nodownload noplaybackrate"
              preload="metadata"
              crossOrigin="anonymous"
              onClick={(e) => e.stopPropagation()}
            >
              <source
                src={post.mediaUrls?.[0]}
                type={`video/${post.mediaUrls?.[0].split(".").pop()}`}
              />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={post?.mediaUrls?.[0]}
              alt="Post"
              className="w-full rounded-lg mt-2"
              loading="lazy"
              onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
              onClick={(e) => e.stopPropagation()}
            />
          ))}


      <div className="flex items-center mt-3 space-x-4">
        <Button variant="ghost" onClick={() => onLike(post._id)}>
          <Heart className={`w-5 h-5 ${isLiked ? "text-red-500" : "text-gray-500"}`} />
          <span>{post.likes.length}</span>
        </Button>
        <Button variant="ghost" onClick={onToggleComments}>
          <MessageCircle className="w-5 h-5 text-gray-500" />
          <span>{localCommentCount}</span>
        </Button>
        <Button variant="ghost"><Share2 className="w-5 h-5 text-gray-500" /></Button>
      </div>

      {isCommentsOpen && <CommentSection postId={post._id} />}
    </div>
  );
});

export default PostCard;
