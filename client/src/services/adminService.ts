import { fetchData } from "@/utils/axiosHelpers";

export const adminOverviewService = {
  getOverviewBase: (range: string,) =>
    fetchData(
      `/admin/overview?range=${range}`,
      { method: "GET" },
      "Failed to fetch base admin overview"
    ),

  getMostLikedPosts: (range: string, likeRange: { min: number; max: number }) =>
    fetchData(
      `/admin/overview/most-liked?range=${range}&minLikes=${likeRange.min}&maxLikes=${likeRange.max}`,
      { method: "GET" },
      "Failed to fetch most liked posts"
    ),
};
