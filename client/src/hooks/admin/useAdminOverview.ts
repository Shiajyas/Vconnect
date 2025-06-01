import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminOverviewService } from "@/services/adminService";
import { useEffect } from "react";
import { socket as adminSocket } from "@/utils/Socket";
import { useAdminAuth } from "../useAdminAuth";

interface LikeRange {
  min: number;
  max: number;
}

export const useAdminOverview = (range: "7d" | "1m" | "1y", likeRange: LikeRange) => {
  const queryClient = useQueryClient();

  // 1. Main overview without like filters
  const { data: baseData, isLoading: baseLoading, refetch: refetchBase } = useQuery({
    queryKey: ["adminOverview", range],
    queryFn: () => adminOverviewService.getOverviewBase(range),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  let {admin} = useAdminAuth();

  console.log(admin.user._id,">>admin  ");

  // 2. Most liked posts with like filter
  const {
    data: likedData,
    isLoading: likedLoading,
    refetch: refetchLiked,
  } = useQuery({
    queryKey: ["adminOverviewMostLiked", range, likeRange.min, likeRange.max],
    queryFn: () => adminOverviewService.getMostLikedPosts(range, likeRange),
    staleTime: 0,
  });

  // useEffect(() => {
  //   adminSocket.emit("admin:join",admin?.user?._id);

  //   adminSocket.on("admin:updateOverview", (newBaseData: unknown) => {
  //     queryClient.setQueryData(["adminOverview", range], newBaseData);
  //   });

  //   return () => {
  //     adminSocket.off("admin:updateOverview");
  //   };
  // }, [queryClient, range]);

  return {
    data: baseData && likedData
      ? {
          ...baseData,
          posts: {
            ...baseData.posts,
            mostLiked: likedData,
          },
        }
      : undefined,
    isLoading: baseLoading || likedLoading,
    refetch: () => {
      refetchBase();
      refetchLiked();
    },
  };
};
