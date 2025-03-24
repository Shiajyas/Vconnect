
    import { useInfiniteQuery} from "@tanstack/react-query";
    import { postService } from "@/services/postService";

    export const useGetComments = (postId: string) => {
      console.log("Fetching comments for post:", postId);
    
      return useInfiniteQuery({
        queryKey: ["comments", postId],
        queryFn: async ({ queryKey, pageParam = 1 }: { queryKey: string[]; pageParam: number | false }) => {
          const response: { comments: Comment[]; nextPage?: number } = await postService.getPostComments(postId, pageParam, 10);
          // console.log("Fetched comments:", response);
    
          return response.comments; // ✅ Return only the array
        },
        getNextPageParam: (lastPage, allPages) => lastPage.length > 0 ? allPages.length + 1 : undefined,
        initialPageParam: 1,
      });
    };
    