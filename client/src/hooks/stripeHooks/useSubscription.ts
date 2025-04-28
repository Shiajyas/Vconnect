import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscriptionStore } from "@/appStore/useSubscriptionStore";
import { userService } from "@/services/userService";

export const useSubscription = (user: any) => {
  const { getSubcriptiontDetails } = userService;
  const { setSubscription } = useSubscriptionStore();
  const queryClient = useQueryClient();

  const stableUserId = user?.parentUserId ?? null;

  const fetchSubscription = async () => {
    if (!stableUserId) return null;

    const data = await getSubcriptiontDetails(stableUserId);
    return data;
  };

  const query = useQuery({
    queryKey: ["subscription", stableUserId],
    queryFn: fetchSubscription,
    enabled: !!stableUserId, // Only fetch if we have a valid userId
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Optionally disable refetching on window focus
  });

  useEffect(() => {
    if (query.isSuccess && query.data) {
      const { isSubscribed, startDate, endDate } = query.data;
      setSubscription(isSubscribed, startDate, endDate);
    }
  }, [query.isSuccess, query.data, setSubscription]);
  
  return {
    ...query,
    refreshSubscription: () =>
      queryClient.invalidateQueries({ queryKey: ["subscription", stableUserId] }),
  };
};
