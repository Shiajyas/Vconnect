import { fetchData } from "@/utils/axiosHelpers";

export const userService = {
    // Fetch user suggestions (paginated)
    getSuggestions: (page: number = 1) => {
        return fetchData(
            `/users/suggestions?page=${page}`,
            {
                method: "GET",
                isAuthRequired: true,
                tokenKey: "userToken",
            },
            "Failed to fetch suggestions"
        );
    },
    
    // Follow a user
    followUser: (userId: string) => {
        return fetchData(
            `/users/follow/${userId}`,
            {
                method: "POST",
                isAuthRequired: true,
                tokenKey: "userToken",
            },
            "Failed to follow user"
        );
    },

    // Unfollow a user
    unfollowUser: (userId: string) => {
        return fetchData(  
            `/users/unfollow/${userId}`,
            {
                method: "POST",
                isAuthRequired: true,
                tokenKey: "userToken",
            },
            "Failed to unfollow user"
        );
    },

    // Get user profile details
    getUserProfile: (userId: string) => {
        return fetchData(
            `/users/profile/${userId}`,
            {
                method: "GET",
                isAuthRequired: true,
                tokenKey: "userToken",
            },
            "Failed to fetch user profile"
        );
    },

    // Get unread notification count
    getNotificationCount: (userId: string) => {
        return fetchData(
            `/users/notification/unreadcount/${userId}`,
            {
                method: "GET",
                isAuthRequired: true,
                tokenKey: "userToken",
            },
            "Failed to fetch notification count"
        );
    },

    // Fetch notifications with pagination (for infinite scrolling)
    getNotifications: ({ pageParam = 1, limit = 15, userId }: { pageParam?: number; limit?: number; userId: string }) => {
        return fetchData(
            `/users/notification?userId=${userId}&page=${pageParam}&limit=${limit}`,
            {
                method: "GET",
                isAuthRequired: true,
                tokenKey: "userToken",
            },
            "Failed to fetch notifications"
        );
    },

    // Delete a specific notification
    deleteNotification: (notificationId: string) => {
        return fetchData(
            `/users/notification/${notificationId}`,
            {
                method: "DELETE",
                isAuthRequired: true,
                tokenKey: "userToken",
            },
            "Failed to delete notification"
        );
    },
};
