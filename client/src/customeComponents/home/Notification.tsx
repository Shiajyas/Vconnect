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
  postId?: string;
  createdAt: string;
  senderName: string;
}

const Notification: React.FC = () => {
  const queryClient = useQueryClient();
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const { user } = useAuthStore();
  const userId = user?._id || null;
  const navigate = useNavigate();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["notifications", userId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userId) throw new Error("User ID is null");
      return await userService.getNotifications({ pageParam, userId });
    },
    getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
    initialPageParam: 1,
    enabled: !!userId,
    refetchInterval: 60000, // Auto refresh notifications every minute
  });

  useEffect(() => {
    if (unreadCount > 0) {
      refetch();
    }
  }, [unreadCount, refetch]);

  /** Handles notification click */
  const handleNotificationClick = (notification: Notification) => {
    console.log("Notification clicked:", notification);

    // Reset unread count
    setUnreadCount(0);

    // Redirect based on notification type
    if (notification.senderId) {
      navigate(`/home/profile/${notification.senderId}`);
    }
    if (notification.postId) {
      navigate(`/home/post/${notification.postId}`);
    }
  };

  /** Delete a notification */
  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await userService.deleteNotification(notificationId);
    },
    onSuccess: (_, notificationId) => {
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
      toast.success("Successfully deleted notification");
    },
    onError: (error) => {
      console.error("Error deleting notification:", error);
    },
  });

  /** Infinite scrolling trigger */
  const observer = useRef<IntersectionObserver | null>(null);
  const lastNotificationRef = useCallback(
    (node: HTMLLIElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
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
              return (
                <li
                  key={notification._id}
                  ref={index === arr.length - 1 ? lastNotificationRef : null}
                  className={`flex justify-between items-center p-3 rounded-md 
                      shadow-sm transition-all duration-300 ease-in-out cursor-pointer 
                      ${notification.read ? "bg-gray-100" : "bg-blue-100"} 
                      hover:shadow-md hover:bg-gray-200 hover:scale-[1.02]`}
                >
                  <div className="flex flex-col">
                    <p>
                      {/* Clickable Sender Name */}
                      <span
                        className="text-blue-500 font-semibold hover:underline cursor-pointer"
                        onClick={() => navigate(`/home/profile/${notification.senderId}`)}
                      >
                        {notification.senderName}
                      </span>{" "}
                      {notification.message.replace(notification.senderName, "")}{" "}
                      {/* Clickable Post Link if exists */}
                      {notification.postId && (
                        <span
                          className="text-blue-500 font-semibold hover:underline cursor-pointer"
                          onClick={() => navigate(`/home/post/${notification.postId}`)}
                        >
                          Post
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
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
