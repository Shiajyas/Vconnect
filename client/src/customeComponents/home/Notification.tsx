import React, { useRef, useEffect, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { Loader2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useNotificationStore from "@/store/notificationStore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";


interface Notification {
  _id: string;
  message: string;
  read: boolean;
  type: string;
  senderId: string;
  postId: string;
  createdAt: string;
  setSelectedPost: any
  userId1: string;

}

interface Page {
  notifications: Notification[];
  nextPage?: number | null;
}

interface NotificationProps {
  // setSelectedPost: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedPost: (postId: string) => void;
}

const Notification: React.FC= () => {
  const queryClient = useQueryClient();
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const {user} = useAuthStore()
  const userId = user?._id || null;

  // console.log("User ID:", userI
  const navigate = useNavigate();


  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading,
    isError,
    error,
} = useInfiniteQuery({
    queryKey: ["notifications", userId],
    queryFn: async ({ pageParam = 1 }) => {
        console.log(`Fetching notifications for user: ${userId}, page: ${pageParam}`);
        if (!userId) throw new Error("User ID is null");
        return await userService.getNotifications({ pageParam, userId });
    },
    getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined, 
    initialPageParam: 1,
    enabled: !!userId,
    refetchInterval: 60000,
});

useEffect(() => {
  if (unreadCount > 0) {
    refetch();
  }
}, [unreadCount, refetch]);


const handleNotificationClick = (notification: Notification) => {
  console.log("Notification clicked:", notification);
  
  if (["like", "comment", "mention", "post"].includes(notification.type) && notification.postId) {
    console.log(">>>>getPostId", notification.postId);
    navigate(`/post/${notification.postId}`);
  } else if (notification.type === "follow" || notification.type === "unfollow") {
    navigate(`users/profile/${notification.senderId}`);
  }
};



  if (isError) {
    console.error("Error fetching notifications:", error);
  }

  // console.log("Fetched notifications data:", data);

  // Delete a notification
  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // console.log(`Deleting notification: ${notificationId}`);
      return await userService.deleteNotification(notificationId);
    },
    onSuccess: (_, notificationId) => {
      // console.log(`Successfully deleted notification: ${notificationId}`);

      queryClient.setQueryData(["notifications", userId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            notifications: page.notifications.filter((n: any) => n._id !== notificationId),
          })),
        };
      });

      refetch();
      toast.success("Successfully deleted notification")
    },
    onError: (error) => {
      console.error("Error deleting notification:", error);
    },
  });

  // Infinite scrolling trigger
  const observer = useRef<IntersectionObserver | null>(null);

  const lastNotificationRef = useCallback(
    (node: HTMLLIElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          // console.log("Fetching next page of notifications...");
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );



  return (
    <div className="p-4 bg-white shadow-md rounded-lg flex-grow h-full flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white shadow-md p-3 z-10 border-b">
        <h2 className="text-lg font-semibold text-center">🔔 Notifications</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto scrollbar-hide p-2">
        {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-primary" />}

        {data?.pages?.flatMap((page) => page.notifications).length === 0 ? (
          <p className="text-center text-gray-500">No notifications</p>
        ) : (
          <ul className="space-y-2">
  {data?.pages?.flatMap((page) => page.notifications).map((notification, index, arr) => {
    const words = notification.message.split(" ");
    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    const middleText = words.slice(1, -1).join(" "); // Middle part of the message

    return (
      <li
        key={notification._id}
        ref={index === arr.length - 1 ? lastNotificationRef : null}
        className="flex justify-between items-center bg-gray-100 p-3 rounded-md 
                  shadow-sm hover:shadow-md hover:bg-gray-200 
                  hover:scale-[1.02] transition-all duration-300 ease-in-out 
                  cursor-pointer"
      >
        <div className="flex flex-col">
          <p>
            <span
              onClick={() => handleNotificationClick(notification)}
              className="text-blue-500 font-semibold hover:underline cursor-pointer"
            >
              {firstWord}
            </span>{" "}
            {middleText}{" "}
            <span
              onClick={() => handleNotificationClick(notification)}
              className="text-blue-500 font-semibold hover:underline cursor-pointer"
            >
              {lastWord}
            </span>
          </p>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering notification click
            deleteMutation.mutate(notification._id);
          }}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </li>
    );
  })}
</ul>

        )}

        {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-primary" />}
      </div>
    </div>
  );
};

export default Notification;
