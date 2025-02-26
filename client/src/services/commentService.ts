import { fetchData } from "../utils/axiosHelpers";

export const commentService = {
  createComment: (postId: string, content: string, token: string) =>
    fetchData(
      `/post/${postId}/comment`,
      {
        method: "POST",
        data: { content },
      },
      "Failed to add comment"
    ),

  getComments: (postId: string, page: number = 1, limit: number = 10, token: string) =>
    fetchData(
      `/post/${postId}/comments`,
      {
        method: "GET",
        params: { page, limit },
      },
      "Failed to fetch comments"
    ),

  updateComment: (commentId: string, content: string, token: string) =>
    fetchData(
      `/comment/${commentId}`,
      {
        method: "PATCH",
        data: { content },
      },
      "Failed to update comment"
    ),

  deleteComment: (commentId: string, token: string) =>
    fetchData(
      `/comment/${commentId}`,
      {
        method: "DELETE",
      },
      "Failed to delete comment"
    ),

  likeComment: (commentId: string, token: string) =>
    fetchData(
      `/comment/${commentId}/like`,
      {
        method: "PATCH",
      },
      "Failed to like comment"
    ),

  unLikeComment: (commentId: string, token: string) =>
    fetchData(
      `/comment/${commentId}/unlike`,
      {
        method: "PATCH",
      },
      "Failed to unlike comment"
    ),
};
