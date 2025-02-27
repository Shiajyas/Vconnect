import React, { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/context/AuthContext";
import CommentSection from "../comments/CommentSection";

interface Post {
  _id: string;
  userId: { fullname: string; avatar: string };
  description: string;
  mediaUrls?: string[];
  likes: string[];
  commentsCount: number;
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onSelect: (postId: string) => void;
}

const PostCard = memo(({ post, onLike, onSelect }: PostCardProps) => {
  const { user } = useAuthStore();
  const userId = user?._id;
  const isLiked = Array.isArray(post.likes) && userId && post.likes.includes(userId);

  // State for toggling the comment section
  const [showComments, setShowComments] = useState(false);

  return (
    <>
      <div
        className="bg-white rounded-xl shadow-lg p-4 mb-4 cursor-pointer hover:bg-gray-100 transition"
        onClick={() => onSelect(post._id)}
      >
        {/* User Info */}
        <div className="flex items-center space-x-3">
          <img
            src={post.userId.avatar}
            alt={post.userId.fullname}
            className="w-10 h-10 rounded-full"
          />
          <h3 className="font-semibold">{post.userId.fullname}</h3>
        </div>
        <span className="text-gray-500 text-sm">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </span>

        {/* Post Content */}
        <p className="mt-2">{post.description}</p>

        {/* Media Handling */}
        {(post?.mediaUrls?.length ?? 0) > 0 &&
          (post?.mediaUrls?.[0] && /\.(mp4|webm|ogg)$/i.test(post.mediaUrls[0]) ? (
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

        {/* Actions */}
        <div className="flex items-center mt-3 space-x-4">
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onLike(post._id);
            }}
            className="flex items-center space-x-2"
          >
            <Heart className={`w-5 h-5 ${isLiked ? "text-red-500" : "text-gray-500"}`} />
            <span>{post.likes.length}</span>
          </Button>

          {/* Toggle Comment Section */}
          <Button
            variant="ghost"
            className="flex items-center space-x-2"
            onClick={(e) => {
              e.stopPropagation();
              setShowComments((prev) => !prev);
            }}
          >
            <MessageCircle className={`w-5 h-5 ${showComments ? "text-blue-500" : "text-gray-500"}`} />
            <span>{post.commentsCount}</span>
          </Button>

          <Button
            variant="ghost"
            className="flex items-center space-x-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        {/* Comment Section (For larger screens) */}
        <div className="hidden sm:block">
          {showComments && (
            <div className="bg-gray-50 p-3 rounded-lg mt-2 border" onClick={(e) => e.stopPropagation()}>
              <CommentSection postId={post._id} />
            </div>
          )}
        </div>
      </div>

      {/* Comment Section (For smaller screens - Overlay) */}
      {showComments && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center sm:hidden z-[60]"
    onClick={() => setShowComments(false)}
  >
    <div 
      className="bg-white w-full max-w-md rounded-lg shadow-lg p-4 relative"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="absolute top-2 right-2 p-1 bg-gray-200 rounded-full hover:bg-gray-300"
        onClick={(e) => {
          setShowComments(false);
        }}
      >
        <X className="w-5 h-5" />
      </button>

      <h2 className="text-lg font-semibold mb-2">Comments</h2>

      <CommentSection postId={post._id} />
    </div>
  </div>
)}

    </>
  );
});

export default PostCard;
