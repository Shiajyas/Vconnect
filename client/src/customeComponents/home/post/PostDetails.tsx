import { useQuery, useQueryClient } from "@tanstack/react-query";
import { postService } from "@/services/postService";
import PostItem from "./PostItem";
import { useLikePost, useUnlikePost } from "@/hooks/usePost";
import { useAuthStore } from "@/context/AuthContext";
import { useEffect } from "react";
import PostSocketService from "@/services/postSocketService";

const PostDetails: React.FC<{ postId: string }> = ({ postId }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?._id;

  console.log("🔍 Rendering PostDetails for postId:", postId);
  console.log("👤 Logged-in User ID:", userId);

  // ✅ Fetch Post Details
  const { data, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      try {
        console.log("📡 Fetching post details for:", postId);
        const response = await postService.getPost(postId);
        console.log("✅ Post fetched:", response);
        return response;
      } catch (error) {
        console.error("❌ Error fetching post:", error);
        throw error;
      }
    },
  });

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
            // Revert optimistic update on error
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
            // Revert optimistic update on error
            queryClient.invalidateQueries({ queryKey: ["post", postId] });
          },
        }
      );
    }
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

      <PostItem post={data.post} onLike={handleLike} onSelect={() => {}} />
    </div>
  );
  
};

export default PostDetails;
