import { User } from "lucide-react";
import { fetchData } from "../utils/axiosHelpers";

export const postService = {
  createPost: (content: FormData) =>
    fetchData(
      "users/posts/upload",
      {
        method: "POST",
        data: content,
        headers: { "Content-Type": "multipart/form-data" },
      },
      "Failed to create post"
    ),

  getPosts: async (page: number = 1, limit: number = 10) => {
    const response = await fetchData(
      "/users/posts",
      {
        method: "GET",
        params: { page, limit },
      },
      "Failed to fetch posts"
    );

    return {
      posts: response?.posts || [],
      nextPage: response?.nextPage || null,
    };
  },

  getPost: (id: string) =>
    fetchData(
      `/users/posts/${id}`,
      {
        method: "GET",
      },
      "Failed to fetch post"
    ),

  updatePost: (id: string, content: string, images: any[]) =>
    fetchData(
      `/users/posts/${id}`,
      {
        method: "PATCH",
        data: { content, images },
      },
      "Failed to update post"
    ),

  deletePost: (id: string) =>
    fetchData(
      `/users/posts/${id}`,
      {
        method: "DELETE",
      },
      "Failed to delete post"
    ),

  likePost: (id: string) =>
    fetchData(
      `/users/posts/${id}/like`,
      {
        method: "PATCH",
      },
      "Failed to like post"
    ),

  unLikePost: (id: string) =>
    fetchData(
      `/users/posts/${id}/unlike`,
      {
        method: "PATCH",
        
      },
      "Failed to unlike post"
    ),

    getPostComments: async (postId: string, page: number = 1, limit: number = 10) : Promise<{ comments: any[] }>=> {
    const response = await fetchData(
      `/users/posts/${postId}/comments`,
      {
        method: "GET",
        params: { page, limit },
      },
      "Failed to fetch post comments"
    );
    return response
    },

  reportPost: (id: string) =>
    fetchData(
      `/users/posts/${id}/report`,
      {
        method: "PATCH",
      },
      "Failed to report post"
    ),

  savePost: (id: string) =>
    fetchData(
      `/users/posts/${id}/save`,
      {
        method: "PATCH",
      },
      "Failed to save post"
    ),

  unSavePost: (id: string) =>
    fetchData(
      `/users/posts/${id}/unsave`,
      {
        method: "PATCH",
      },
      "Failed to unsave post"
    ),

};
