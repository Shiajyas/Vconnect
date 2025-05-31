import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminOverviewService } from "@/services/adminService";
import { useEffect } from "react";
import { socket as adminSocket } from "@/utils/Socket";

export const useAdminOverview = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewService.getAdminOverview,
  });

  useEffect(() => {
    adminSocket.emit("admin:join");

    adminSocket.on("admin:updateOverview", (newData: unknown) => {
      queryClient.setQueryData(["adminOverview"], newData);
    });

    return () => {
      adminSocket.off("admin:updateOverview");
    };
  }, [queryClient]);

  return { data, isLoading, refetch };
};
