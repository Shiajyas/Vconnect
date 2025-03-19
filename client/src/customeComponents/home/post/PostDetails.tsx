import { useState, useEffect, } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { postService } from "@/services/postService";
import PostItem from "./PostItem";
import { useLikePost, useUnlikePost } from "@/hooks/usePost";
import { useAuthStore } from "@/context/AuthContext";
import { socket } from "@/utils/Socket";
import PostSocketService from "@/services/postSocketService";
import { useParams } from "react-router-dom";
import { useNavigate} from "react-router-dom";


const PostDetails: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>(); // Get postId from URL

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?._id;

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  console.log("🔍 Rendering PostDetails for postId:", postId);
  console.log("👤 Logged-in User ID:", userId);

  // ✅ Fetch Post Details
  const { data, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      try {
        console.log("📡 Fetching post details for:", postId);
        const response = await postService.getPost(postId || "");
        console.log("✅ Post fetched:", response);
        return response;
      } catch (error) {
        console.error("❌ Error fetching post:", error);
        throw error;
      }
    },
  });

  useEffect(() => {
    const handleNewComment = (data: { postId: string }) => {
      if (data.postId === postId) {
        queryClient.invalidateQueries({ queryKey: ["post", postId] });
        queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      }
    };

    const handleDeleteComment = (data: { postId: string }) => {
      if (data.postId === postId) {
        queryClient.invalidateQueries({ queryKey: ["post", postId] });
        queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      }
    };

    const handleDeletePost = ()=>{
      navigate(-1)
    }

    socket.on("newComment", handleNewComment);
    socket.on("delete_comment", handleDeleteComment);
    socket.on("deletePost",handleDeletePost)

    return () => {
      socket.off("newComment", handleNewComment);
      socket.off("delete_comment", handleDeleteComment);
      socket.off("deletePost",handleDeletePost);
    };
  }, [queryClient, postId]);

  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();

  const handleLike = () => {
    if (!data) {
      console.warn("⚠️ handleLike called but data is missing.");
      return;
    }

    if (!userId) {
      console.warn("⚠️ User not logged in, cannot like.");
      return;
    }

    const post = data.post;

    if (!Array.isArray(post.likes)) {
      console.error("❌ post.likes is not an array:", post.likes);
      return;
    }

    const isLiked = post.likes.includes(userId);
    console.log(`💙 Like status before: ${isLiked ? "Liked" : "Not Liked"}`);

    // ✅ Optimistically update UI
    queryClient.setQueryData(["post", postId], (oldData: any) => {
      if (!oldData) return oldData;

      const updatedLikes = isLiked
        ? oldData.post.likes.filter((id: string) => id !== userId) // Remove like
        : [...oldData.post.likes, userId]; // Add like

      return { ...oldData, post: { ...oldData.post, likes: updatedLikes } };
    });

    if (isLiked) {
      console.log("🚀 Unliking post...");
      unlikeMutation.mutate(
        { postId, userId },
        {
          onError: (error) => {
            console.error("❌ Error unliking post:", error);
            queryClient.invalidateQueries({ queryKey: ["post", postId] });
          },
        }
      );
    } else {
      console.log("🚀 Liking post...");
      likeMutation.mutate(
        { postId, userId },
        {
          onError: (error) => {
            console.error("❌ Error liking post:", error);
            queryClient.invalidateQueries({ queryKey: ["post", postId] });
          },
        }
      );
    }
  };

  const handleToggleComments = () => {
    setIsCommentsOpen((prev) => !prev);
  };

  const postSocketService = new PostSocketService(queryClient);

  useEffect(() => {
    postSocketService.handleLikeUpdates();

    return () => {
      postSocketService.removeListeners();
    };
  }, [postSocketService]);

  if (isLoading) {
    console.log("⏳ Loading post...");
    return <p>Loading post...</p>;
  }

  if (!data) {
    console.warn("⚠️ Post not found.");
    return <p>Post not found.</p>;
  }

  console.log("🎉 Rendering PostItem with post data:", data.post);

  return (
    <div className="w-full min-w-full max-w-2xl mx-auto p-4 sm:max-w-full sm:px-2">
            <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 text-sm font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-900 transition"
      >
        ← Back
      </button>

      <PostItem 
        post={data.post} 
        onLike={handleLike} 
        isCommentsOpen={isCommentsOpen} 
        onToggleComments={handleToggleComments} 
        userId={userId }
        isLiked={data.post.likes.includes(userId)} 
      />
    </div>
  );
};

export default PostDetails;
