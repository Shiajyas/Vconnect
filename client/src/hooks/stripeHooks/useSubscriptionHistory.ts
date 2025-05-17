import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/userService";


export const useSubscriptionHistory = (userId: string) => {
  return useQuery({
    queryKey: ["subscription-history", userId],
    queryFn: () => userService.getSubscriptionHistory(userId),
    // enabled: !!userId,
  });
};
