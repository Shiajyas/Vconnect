import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/context/AuthContext";

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
 
  onLike: any;
}

const PostCard = memo(({ post,  onLike }: PostCardProps) => {
    const { user} = useAuthStore();
    let userId = user?._id;
    const isLiked = Array.isArray(post.likes) && userId && post.likes.includes(userId);

    console.log(userId,">>>post");
    
  
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
        {/* User Info */}
        <div className="flex items-center space-x-3">
          <img src={post.userId.avatar} alt={post.userId.fullname} className="w-10 h-10 rounded-full" />
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
          >
            <source src={post.mediaUrls?.[0]} type={`video/${post.mediaUrls?.[0].split(".").pop()}`} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={post?.mediaUrls?.[0]}
            alt="Post"
            className="w-full rounded-lg mt-2"
            loading="lazy"
            onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
          />
        ))}
  
        {/* Actions */}
        <div className="flex items-center mt-3 space-x-4">
          <Button variant="ghost" onClick={() => onLike(post._id)} className="flex items-center space-x-2">
            <Heart className={`w-5 h-5 ${isLiked ? "text-red-500" : "text-gray-500"}`} />
            <span>{post.likes.length}</span>
          </Button>
           <Button variant="ghost" className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-gray-500" />
          <span>{post.commentsCount}</span>
        </Button>
        <Button variant="ghost" className="flex items-center space-x-2">
          <Share2 className="w-5 h-5 text-gray-500" />
        </Button>
        </div>
      </div>
    );
  });
  

export default PostCard;
