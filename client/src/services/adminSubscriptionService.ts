
import { fetchData } from "@/utils/axiosHelpers";

export const adminSubscriptionService = {
  getSubscriptions: (params: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
  }) =>
    fetchData(
      "/admin/subscriptions",
      {
        method: "GET",
        params,
      },
      "Failed to fetch subscriptions"
    ),

  getAllSubscriptions: (params: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    fetchData(
      "/admin/subscriptions/all",
      {
        method: "GET",
        params,
      },
      "Failed to fetch all subscriptions"
    ),

  toggleSubscriptionStatus: (id: string, isSubscribed: boolean) =>
    fetchData(
      `/admin/subscriptions/${id}`,
      {
        method: "PATCH",
        data: { isSubscribed },
      },
      "Failed to toggle subscription status"
    ),
};
