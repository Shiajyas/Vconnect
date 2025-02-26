import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { postService } from "../services/postService";
import { imageUpload } from "../features/imageUpload";

//  Fetch Infinite Posts (Fixed Query Key & Pagination)
export const useGetPosts = (token: string) => {
  return useInfiniteQuery({
    queryKey: ["posts", token], 
    queryFn: async ({ pageParam = 1 }) => {
      const { posts, nextPage } = await postService.getPosts(pageParam as number, 10);
      return posts;
    },
    getNextPageParam: (lastPage: any[], pages) =>
      lastPage.length > 0 ? pages.length + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30000, 
  });
};


// ✅ Create Post (Fixed Cache Update)
export const useUploadPost = (token: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, FormData>({
    mutationFn: async (formData: FormData): Promise<any> => {
      return postService.createPost(formData,);
    },
    onSuccess: (_, variables) => {
  
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: () => {
      alert("Upload failed!");
    },
  });
};

// ✅ Update Post (Fixed Cache Update)
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { content: string; images: any[]; postId: string; auth: any }>({
    mutationFn: async ({ content, images, postId, auth }: { content: string; images: any[]; postId: string; auth: { token: string } }) => {
      let media = [];
      if (images.length > 0) {
        media = await imageUpload(images, auth.token);
      }

      const updatedPost = await postService.updatePost(postId, content, media);

      // ✅ Correct cache update
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      return updatedPost;
    }
  });
};

// ✅ Delete Post (Fixed Cache Update)
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, { postId: string; auth: any }>({
    mutationFn: async ({ postId, auth }: { postId: string; auth: any }) => {
      await postService.deletePost(postId,);

      // ✅ Correct cache update
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      return postId;
    }
  });
};
