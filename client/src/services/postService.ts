import { fetchData } from "../utils/axiosHelpers";

export const postService = {
  
    createPost: (content: FormData, token: string) =>
      fetchData(
        "users/posts/upload",
        {
          method: "POST",
          isAuthRequired: true,
          data: content, 
          tokenKey: token,
          headers: { "Content-Type": "multipart/form-data" },
        },
        "Failed to create post"
      ),
  
  

  getPosts: (page: number = 1, limit: number = 10, token: string) =>
    fetchData(
      "/posts",
      {
        method: "GET",
        isAuthRequired: true,
        tokenKey: token,
        params: { page, limit },
      },
      "Failed to fetch posts"
    ),

  getPost: (id: string, token: string) =>
    fetchData(
      `/post/${id}`,
      {
        method: "GET",
        isAuthRequired: true,
        tokenKey: token,
      },
      "Failed to fetch post"
    ),

  updatePost: (id: string, content: string, images: any[], token: string) =>
    fetchData(
      `/post/${id}`,
      {
        method: "PATCH",
        data: { content, images },
        tokenKey: token,
      },
      "Failed to update post"
    ),

  deletePost: (id: string, token: string) =>
    fetchData(
      `/post/${id}`,
      {
        method: "DELETE",
        tokenKey: token,
      },
      "Failed to delete post"
    ),

  likePost: (id: string, token: string) =>
    fetchData(
      `/post/${id}/like`,
      {
        method: "PATCH",
        tokenKey: token,
      },
      "Failed to like post"
    ),

  unLikePost: (id: string, token: string) =>
    fetchData(
      `/post/${id}/unlike`,
      {
        method: "PATCH",
        tokenKey: token,
      },
      "Failed to unlike post"
    ),

  reportPost: (id: string, token: string) =>
    fetchData(
      `/post/${id}/report`,
      {
        method: "PATCH",
        tokenKey: token,
      },
      "Failed to report post"
    ),

  savePost: (id: string, token: string) =>
    fetchData(
      `/post/${id}/save`,
      {
        method: "PATCH",
        tokenKey: token,
      },
      "Failed to save post"
    ),

  unSavePost: (id: string, token: string) =>
    fetchData(
      `/post/${id}/unsave`,
      {
        method: "PATCH",
        tokenKey: token,
      },
      "Failed to unsave post"
    ),
};
