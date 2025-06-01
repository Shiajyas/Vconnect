import { fetchData } from "@/utils/axiosHelpers"; // assuming this is your fetch wrapper

interface ReportQueryParams {
  page: number;
  limit: number;
}

export const adminReportService = {
  getReportedPosts: ({ page, limit }: ReportQueryParams) =>
    fetchData(
      `/admin/reports?page=${page}&limit=${limit}`,
      { method: "GET" },
      "Failed to fetch reported posts"
    ),

  getReportCount: () =>
    fetchData(
      `/admin/reports/count`,
      { method: "GET" },
      "Failed to fetch report count"
    ),

  dismissReport: (reportId: string) =>
    fetchData(
      `/admin/reports/${reportId}/dismiss`,
      { method: "DELETE" },
      "Failed to dismiss report"
    ),

  blockPost: (postId: string) =>
    fetchData(
      `/admin/posts/${postId}/block`,
      { method: "POST" },
      "Failed to block post"
    ),

  getPostById: (postId: string) =>
    fetchData(
      `/posts/${postId}`,
      { method: "GET" },
      "Failed to get post"
    ),

  getUserById: (userId: string) =>
    fetchData(
      `/users/${userId}`,
      { method: "GET" },
      "Failed to get user"
    ),
};
