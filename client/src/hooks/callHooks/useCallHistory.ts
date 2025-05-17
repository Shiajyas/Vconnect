// hooks/useCallHistory.ts
import { useQuery } from "@tanstack/react-query";
import { callService } from "@/services/callService";

export const useCallHistory = (userId: string) => {
  return useQuery({
    queryKey: ["callHistory", userId],
    queryFn: () => callService.getCallHistory(userId),
    enabled: !!userId,
  });
};
