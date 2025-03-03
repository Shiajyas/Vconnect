
import { socket } from "@/utils/Socket";
import { QueryClient } from "@tanstack/react-query";

class PostSocketService {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  // ✅ Handle Like Updates
  handleLikeUpdates = () => {
    socket.on("update_like_count", ({ postId, likes }) => {
        console.log("🔹 Received update_like_count event:", { postId, likes });
      
        this.queryClient.setQueryData(["posts"], (oldData: any) => {
          if (!oldData) return oldData;
      
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: page.posts.map((post: any) =>
                post._id === postId ? { ...post, likes } : post
              ),
            })),
          };
        });
      
        // ✅ Ensure the post details are updated
        this.queryClient.setQueryData(["post", postId], (oldData: any) => {
          if (!oldData || !oldData.post) return oldData;
          return { ...oldData, post: { ...oldData.post, likes } };
        });
      
        // Revalidate both queries
        this.queryClient.invalidateQueries({ queryKey: ["posts"] });
        this.queryClient.invalidateQueries({ queryKey: ["post", postId] });
      });
      
  };

  // ✅ Cleanup function
  removeListeners = () => {
    socket.off("update_like_count");
  };
}

export default PostSocketService;
