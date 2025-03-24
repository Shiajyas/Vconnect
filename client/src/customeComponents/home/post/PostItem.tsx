import React, { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Heart, MessageCircle, Share2, Bookmark, MoreVertical, Edit, Trash2, X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/utils/Socket";
import CommentSection from "../comments/CommentSection";
import { useAuthStore } from "@/context/AuthContext";
import ConfirmModal from "@/customeComponents/common/confirmationModel";

interface Post {
  _id: string;
  userId: { _id: string; fullname: string; avatar: string };
  description: string;
  mediaUrls?: string[];
  likes: string[];
  commendCount: number;
  createdAt: string;
  saved: string[];
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onToggleComments: () => void;
  isLiked: boolean;
  isCommentsOpen: boolean;
  onClick: () => void;
}

const PostCard = memo(({ post, onLike, onToggleComments, isLiked, isCommentsOpen,onClick }: PostCardProps) => {
  const [localCommentCount, setLocalCommentCount] = useState(post.commendCount);
  const { user } = useAuthStore();
  const userId = user?._id;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState<boolean>(post.saved.includes(userId));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_LENGTH = 150;


  useEffect(() => {
    setIsSaved(post.saved.includes(userId));
  }, [post.saved, userId]);

  useEffect(() => {
    setLocalCommentCount(post.commendCount);
  }, [post.commendCount]);

  console.log(post,">>>>>>>>>>>>>>>>>>>>321")

  const handleSavePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    socket.emit("savePost", { postId: post._id, userId });
  };

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    navigate(`/home/profile/${userId}`);
  };

  const handleEditPost = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/home/edit-post/${post._id}`);
  };

  const handleDeletePost = () => {
    if (!userId) return;
    socket.emit("deletePost", { postId: post._id, userId });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    setDeleteModalOpen(false);
  };

  const handleMediaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-4 cursor-pointer relative">
      {/* User Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={post.userId?.avatar}
            alt={post.userId?.fullname}
            className="w-10 h-10 rounded-full cursor-pointer"
            onClick={(e) => handleProfileClick(e, post.userId._id)}
          />
          <h3
            className="font-semibold cursor-pointer"
            onClick={(e) => handleProfileClick(e, post.userId._id)}
          >
            {post.userId?.fullname}
          </h3>
        </div>

        {userId === post?.userId?._id && (
          <div className="relative">
            <button className="p-2" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-28 bg-white shadow-lg rounded-lg p-2 z-10">
                <button className="flex items-center space-x-2 w-full p-2 hover:bg-gray-100 rounded-md" onClick={handleEditPost}>
                  <Edit className="w-4 h-4 text-gray-600" />
                  <span>Edit</span>
                </button>
                <button
                  className="flex items-center space-x-2 w-full p-2 hover:bg-gray-100 rounded-md text-red-500"
                  onClick={(e) => { e.stopPropagation(); setDeleteModalOpen(true); }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <span className="text-gray-500 text-sm">
        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
      </span>

      <p className="mt-2" onClick={onClick}>
        {isExpanded ? post?.description : post?.description?.slice(0, MAX_LENGTH)}
        {post?.description.length > MAX_LENGTH && (
          <button
            className="text-blue-500 ml-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? "Read Less" : "Read More"}
          </button>
        )}
      </p>
  
      {/* Media Preview */}
      {post?.mediaUrls?.length > 0 && (
       
        <div className="mt-2">
          {post.mediaUrls[0].endsWith(".mp4") || post.mediaUrls[0].endsWith(".webm") ? (
            
            <video className="w-full h-[300px] object-cover rounded-lg" controls onClick={handleMediaClick}>
              <source src={post.mediaUrls[0]} type="video/mp4" />
            </video>
          ) : (
            <img src={post.mediaUrls[0]} alt="Post" className="w-full h-[300px] object-cover rounded-lg" loading="lazy" onClick={handleMediaClick} />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center mt-3 space-x-4">
        <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onLike(post._id); }}>
          <Heart className={`w-5 h-5 ${isLiked ? "text-red-500" : "text-gray-500"}`} />
          <span>{post.likes.length}</span>
        </Button>
        <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onToggleComments(); }}>
          <MessageCircle className="w-5 h-5 text-gray-500" />
          <span>{localCommentCount}</span>
        </Button>
        <Button variant="ghost">
          <Share2 className="w-5 h-5 text-gray-500" />
        </Button>
        <Button variant="ghost" onClick={handleSavePost}>
          <Bookmark className={`w-5 h-5 ${isSaved ? "text-blue-500" : "text-gray-500"}`} />
        </Button>
      </div>

      {isCommentsOpen && <CommentSection postId={post._id} />}

      {isDeleteModalOpen && (
        <ConfirmModal
          isOpen
          title="Delete Post?"
          message="Are you sure you want to delete this post?"
          onConfirm={handleDeletePost}
          onClose={() => setDeleteModalOpen(false)}
        />
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <button className="absolute top-4 right-4 text-white text-3xl" onClick={() => setIsFullscreen(false)}>
            <X />
          </button>
          {post.mediaUrls?.[0]?.endsWith(".mp4") || post.mediaUrls?.[0]?.endsWith(".webm") ? (
            <video className="max-w-full max-h-full" controls autoPlay>
              <source src={post.mediaUrls[0]} type="video/mp4" />
            </video>
          ) : (
            <img src={post.mediaUrls[0]} alt="Fullscreen" className="max-w-full max-h-full" />
          )}
        </div>
      )}
    </div>
  );
});

export default PostCard;
