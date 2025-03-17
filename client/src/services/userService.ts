import { fetchData } from "@/utils/axiosHelpers";

export const userService = {
    // Fetch user suggestions (paginated)
    getSuggestions: (page: number = 1) => {
        return fetchData(
            `/users/suggestions?page=${page}`,
            {
                method: "GET",
                 },
            "Failed to fetch suggestions"
        );
    },
    
    // Follow a user
    getFollowers: (userId: string) => {
        return fetchData(
            `/users/followers/${userId}`,
            {
                method: "GET",
             }, 

            "Failed to follow user"
        );
    },
    
    getFollowing: (userId: string) => {
        return fetchData(
            `/users/following/${userId}`,
            {
                method: "GET",
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
         },
            "Failed to delete notification"
        );
    },

    getUserMediaPosts: (userId: string) => {
        return fetchData(
            `/users/post/${userId}`,
            {
                method: "GET"
            },
            "faild to fetch post"
        )
    },

    updateUserProfile: (userId: string, updatedData: any) => {
        return fetchData(
            `/users/profile/${userId}`,
            {
                method: "PUT",
                data: updatedData,
                headers: { "Content-Type": "multipart/form-data" },
             
            },
            "Failed to update profile"
        );
    },

    getUserSavedPosts:(userId: string)=>{
        return fetchData(
            `/users/profile/savedPost/${userId}`,
            {
                method: "GET"
            },
            "failed to get savedPost"
        )
    }
};
