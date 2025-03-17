import React, { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Edit, Trash2 } from "lucide-react";
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

const PostCard = memo(({ post, onLike, onToggleComments, isLiked, isCommentsOpen, onClick }: PostCardProps) => {
  const [localCommentCount, setLocalCommentCount] = useState(post.commendCount);
  const { user } = useAuthStore();
  const userId = user?._id;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState<boolean>(post.saved.includes(userId));
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false); // Confirmation modal state

  useEffect(() => {
    setIsSaved(post.saved.includes(userId));
  }, [post.saved, userId]);

  useEffect(() => {
    const handleNewComment = (data: { postId: string }) => {
      if (data.postId === post._id) {
        setLocalCommentCount((prev) => prev + 1);
      }
    };

    const handleDeleteComment = (data: { postId: string }) => {
      if (data.postId === post._id) {
        setLocalCommentCount((prev) => Math.max(prev - 1, 0));
      }
    };

    socket.on("newComment", handleNewComment);
    socket.on("delete_comment", handleDeleteComment);

    return () => {
      socket.off("newComment", handleNewComment);
      socket.off("delete_comment", handleDeleteComment);
    };
  }, [post._id]);

  const handleSavePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    socket.emit("savePost", { postId: post._id, userId });
  };

  useEffect(() => {
    const handleSavePostResponse = (data: { postId: string; saved: boolean }) => {
      if (data.postId === post._id) {
        setIsSaved(data.saved);
      }
    };

    socket.on("postSaved", handleSavePostResponse);

    return () => {
      socket.off("postSaved", handleSavePostResponse);
    };
  }, [post._id]);

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
    setDeleteModalOpen(false); // Close modal after deleting
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-4 cursor-pointer relative" >
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
                  onClick={(e) => {e.stopPropagation(); setDeleteModalOpen(true)}} // Open modal on click
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

      <p className="mt-2" onClick={onClick}>{post?.description}</p>

      {post?.mediaUrls?.length > 0 && (
        <div className="mt-2">
          <img src={post?.mediaUrls[0]} alt="Post" className="w-full rounded-lg" loading="lazy" onClick={onClick} />
        </div>
      )}

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

      {/* Confirmation Modal for Deleting Post */}
      {isDeleteModalOpen && (
        <ConfirmModal
        isOpen
          title="Delete Post?"
          message="Are you sure you want to delete this post? This action cannot be undone."
          onConfirm={handleDeletePost}
          onClose={() => setDeleteModalOpen(false)}
        />
      )}
    </div>
  );
});

export default PostCard;
